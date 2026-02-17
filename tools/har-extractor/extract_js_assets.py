#!/usr/bin/env python3
"""
extract_js_assets.py - HAR JS Assets Extractor
Извлекает JavaScript ресурсы из HAR файла
"""

import json
import os
import zipfile
import hashlib
from urllib.parse import urlparse, unquote
from pathlib import Path
from datetime import datetime
import sys

def extract_filename_from_url(url):
    """Извлекает имя файла из URL"""
    parsed = urlparse(url)
    path = unquote(parsed.path)
    filename = path.split('/')[-1]
    
    # Если нет расширения или имени, используем hash
    if not filename or '.' not in filename:
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        filename = f"script_{url_hash}.js"
    
    return filename

def extract_js_assets(har_file, output_dir="js_assets"):
    """Извлекает JS assets из HAR файла"""
    
    print(f"[*] Читаю HAR файл: {har_file}")
    
    with open(har_file, 'r', encoding='utf-8') as f:
        har_data = json.load(f)
    
    entries = har_data.get('log', {}).get('entries', [])
    print(f"[*] Найдено entries: {len(entries)}")
    
    # Создаем директорию для assets
    os.makedirs(output_dir, exist_ok=True)
    
    js_assets = []
    stats = {
        'total_entries': len(entries),
        'js_files': 0,
        'extracted': 0,
        'failed': 0,
        'total_size': 0
    }
    
    # Фильтруем JS файлы
    for idx, entry in enumerate(entries):
        try:
            request = entry.get('request', {})
            response = entry.get('response', {})
            url = request.get('url', '')
            mime_type = response.get('content', {}).get('mimeType', '')
            
            # Проверяем, является ли это JS файлом
            is_js = (
                mime_type.startswith('application/javascript') or
                mime_type.startswith('text/javascript') or
                url.endswith('.js') or
                '/js/' in url or
                '_spa/assets/' in url or
                'vendors-' in url
            )
            
            if not is_js:
                continue
            
            stats['js_files'] += 1
            
            # Получаем содержимое
            content = response.get('content', {})
            text = content.get('text', '')
            encoding = content.get('encoding', '')
            size = content.get('size', 0)
            
            if not text:
                print(f"  [!] Пропущен (пустой): {url}")
                stats['failed'] += 1
                continue
            
            # Декодируем если нужно
            if encoding == 'base64':
                import base64
                try:
                    text = base64.b64decode(text).decode('utf-8')
                except:
                    print(f"  [!] Ошибка декодирования base64: {url}")
                    stats['failed'] += 1
                    continue
            
            # Генерируем имя файла
            filename = extract_filename_from_url(url)
            filepath = os.path.join(output_dir, filename)
            
            # Если файл уже существует, добавляем суффикс
            if os.path.exists(filepath):
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(filepath):
                    filename = f"{base}_{counter}{ext}"
                    filepath = os.path.join(output_dir, filename)
                    counter += 1
            
            # Сохраняем файл
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)
            
            file_size = os.path.getsize(filepath)
            stats['extracted'] += 1
            stats['total_size'] += file_size
            
            js_assets.append({
                'filename': filename,
                'url': url,
                'size': file_size,
                'mime_type': mime_type
            })
            
            print(f"  [✓] {filename} ({file_size:,} bytes)")
            
        except Exception as e:
            print(f"  [!] Ошибка обработки entry {idx}: {e}")
            stats['failed'] += 1
    
    # Создаем архив
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    archive_name = f"perplexity_js_assets_{timestamp}.zip"
    
    print(f"\n[*] Создаю архив: {archive_name}")
    
    with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Добавляем все JS файлы
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(output_dir))
                zipf.write(file_path, arcname)
        
        # Добавляем метаданные
        metadata = {
            'extraction_date': timestamp,
            'source_har': os.path.basename(har_file),
            'statistics': stats,
            'assets': js_assets
        }
        
        zipf.writestr('metadata.json', json.dumps(metadata, indent=2))
    
    archive_size = os.path.getsize(archive_name)
    
    # Печатаем статистику
    print(f"\n{'='*60}")
    print(f"СТАТИСТИКА ЭКСТРАКЦИИ")
    print(f"{'='*60}")
    print(f"Всего entries в HAR:     {stats['total_entries']}")
    print(f"JS файлов обнаружено:    {stats['js_files']}")
    print(f"Успешно извлечено:       {stats['extracted']}")
    print(f"Ошибок:                  {stats['failed']}")
    print(f"Общий размер файлов:     {stats['total_size']:,} bytes")
    print(f"Размер архива:           {archive_size:,} bytes")
    print(f"{'='*60}")
    print(f"\n[✓] Архив создан: {archive_name}")
    
    return archive_name, stats

if __name__ == "__main__":
    har_file = "www.perplexity.ai.har.json"
    
    if not os.path.exists(har_file):
        print(f"[!] HAR файл не найден: {har_file}")
        print(f"[*] Текущая директория: {os.getcwd()}")
        print(f"[*] Доступные файлы: {os.listdir('.')[:10]}")
        sys.exit(1)
    
    try:
        archive_name, stats = extract_js_assets(har_file)
        print(f"\n[*] Готово! Архив: {archive_name}")
    except Exception as e:
        print(f"[!] Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
