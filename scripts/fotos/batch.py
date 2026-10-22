import sys,os,glob,time
sys.path.insert(0,'/tmp/sr')
from sr import upscale
from PIL import Image
src,dst=sys.argv[1],sys.argv[2]
fs=sorted(glob.glob(src+'/*.png'))
for i,f in enumerate(fs):
    out=os.path.join(dst,os.path.basename(f))
    if os.path.exists(out): continue
    t=time.time(); upscale(Image.open(f)).save(out); print(i+1,len(fs),os.path.basename(f),round(time.time()-t),flush=True)
print("FIN",flush=True)
