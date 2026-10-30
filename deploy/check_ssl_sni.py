import ssl
import socket

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with socket.create_connection(('103.119.237.132', 443), timeout=5) as sock:
        with ctx.wrap_socket(sock, server_hostname='kimholidaytravel.id') as ssock:
            cert = ssock.getpeercert(binary_form=False)
            print("SERVER IP SSL CONNECTED!")
            # Get binary cert to parse SAN
            der = ssock.getpeercert(binary_form=True)
            import ssl
            # In Python 3.10+, SSLSocket can decode cert
            print("Cipher:", ssock.cipher())
            print("Version:", ssock.version())
except Exception as e:
    print("SSL DIRECT ERROR:", e)
