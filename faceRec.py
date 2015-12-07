## auto face marker
import time
import cv2
import os
import numpy as np
import datetime
from collections import deque

os.chdir(r"C:\Users\ywang\Desktop\WanU - Copy\static_files\mining")

def faceDet(photo):
    faceCascade=cv2.CascadeClassifier('C:\opencv\sources\data\haarcascades\haarcascade_frontalface_default.xml')
    count=0
    
    try:
        img=cv2.imread(photo)
        print(photo)
        print(datetime.datetime.now())
        #gray=cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if img.shape[0]==2448:
            print("caught you")
            print(photos[i])
        try:
            faces = faceCascade.detectMultiScale(img, 1.2, 5)
        except:
            faceCascade=cv2.CascadeClassifier('C:\opencv\sources\data\haarcascades\haarcascade_frontalface_default.xml')
            faces=[]
        ##print("No. Faces: ", len(faces))
        ## find the largest face
        hvector=[]
        for (x,y,w,h) in faces:
            cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
##        cv2.imshow("Faces found" ,img)
##        cv2.waitKey(0)
        cv2.imwrite(photo, img) ## not quite

            
##            hvector.append(h)
##        if hvector !=[]:
##            print("next..........")
##            index=hvector.index(max(hvector))
##            (x,y, w, h)=faces[index]
##            cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
##            roi_gray = gray[y:y+h, x:x+w]
##            cv2.imwrite(r'C:\Users\ywang\Desktop\1\\'+str(count)+".png", roi_gray)
##            print("ok")
##            count+=1
##            print("Face count: ", count)
    except:
        pass


existing=[]

while True:
    time.sleep(3)
    new=os.listdir(r"C:\Users\ywang\Desktop\WanU - Copy\static_files\mining")
    for image in new:
        if image not in existing:
            faceDet(image)
    existing=new






