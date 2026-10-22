import sys, time, numpy as np, ncnn
from PIL import Image
net = ncnn.Net()
net.opt.use_vulkan_compute = False
net.opt.num_threads = 2
net.load_param("/tmp/sr/models/realesrgan-x4plus.param")
net.load_model("/tmp/sr/models/realesrgan-x4plus.bin")
def run_tile(arr):  # arr HxWx3 float 0..1
    m = ncnn.Mat(np.ascontiguousarray(arr.transpose(2,0,1)).astype(np.float32))
    ex = net.create_extractor()
    ex.input("data", m)
    _, out = ex.extract("output")
    return np.array(out).transpose(1,2,0)
def upscale(img, tile=160, pad=12):
    a = np.asarray(img.convert("RGB")).astype(np.float32)/255.
    H,W,_ = a.shape; S=4
    out = np.zeros((H*S,W*S,3),np.float32)
    for y in range(0,H,tile):
        for x in range(0,W,tile):
            y0,x0=max(y-pad,0),max(x-pad,0); y1,x1=min(y+tile+pad,H),min(x+tile+pad,W)
            r = run_tile(a[y0:y1,x0:x1])
            oy,ox=(y-y0)*S,(x-x0)*S; h,w=min(tile,H-y)*S,min(tile,W-x)*S
            out[y*S:y*S+h,x*S:x*S+w]=r[oy:oy+h,ox:ox+w]
    return Image.fromarray((out.clip(0,1)*255+.5).astype(np.uint8))
if __name__=="__main__":
    t=time.time(); im=Image.open(sys.argv[1]); o=upscale(im); o.save(sys.argv[2]); print(im.size,o.size,round(time.time()-t,1),"s")
