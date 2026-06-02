import paramiko
import sys

host = '192.168.1.2'
user = 'tiago'
password = 'Tipitapa1!'

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    
    commands = [
        "docker logs miraprecios_scraper --tail 50",
        "docker logs miraprecios_crawler --tail 50",
        "k3s kubectl get pods -A" # In case TrueNAS scale uses k3s instead of raw docker
    ]
    
    for cmd in commands:
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print("STDOUT:", out.strip()[-1000:])
        if err: print("STDERR:", err.strip()[-1000:])
        
    ssh.close()
except Exception as e:
    print(f"Failed to connect or execute: {e}")
