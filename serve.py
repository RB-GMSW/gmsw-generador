import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from http.server import HTTPServer, SimpleHTTPRequestHandler
HTTPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 3000), SimpleHTTPRequestHandler).serve_forever()
