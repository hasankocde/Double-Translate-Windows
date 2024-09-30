

Double Translate Windows                 
├─ assets                                
│  ├─ icons                              
│  │  ├─ 1024x1024.png                   
│  │  ├─ 128x128.png                     
│  │  ├─ 16x16.png                       
│  │  ├─ 24x24.png                       
│  │  ├─ 256x256.png                     
│  │  ├─ 32x32.png                       
│  │  ├─ 48x48.png                       
│  │  ├─ 512x512.png                     
│  │  └─ 64x64.png                       
│  ├─ assets.d.ts                        
│  ├─ entitlements.mac.plist             
│  ├─ icon.png                           
│  └─ raw_icon.png                       
├─ exe                                   
│  └─ Double Translator Setup 1.0.3.exe  
├─ release                               
│  └─ app                                
│     ├─ package-lock.json               
│     └─ package.json                    
├─ src                                   
│  ├─ locales                            
│  │  └─ en-US.json                      
│  ├─ main                               
│  │  ├─ main.ts                         
│  │  ├─ preload.ts                      
│  │  └─ util.ts                         
│  ├─ renderer                           
│  │  ├─ App.tsx                         
│  │  ├─ i18n.ts                         
│  │  ├─ index.ejs                       
│  │  ├─ index.tsx                       
│  │  ├─ preload.d.ts                    
│  │  └─ Settings.tsx                    
│  ├─ styles                             
│  │  └─ app.css                         
│  └─ __tests__                          
│     └─ App.test.tsx                    
├─ package-lock.json                     
├─ package.json                          
├─ README.md                             
└─ tsconfig.json                         


Hello, I developed this application on 3 different platforms (Windows, Android and ChromeExtentions) to help those who have difficulty learning a foreign language.

English is a widely spoken language globally, and almost everyone knows at least a little bit of English. 

For those trying to learn a language other than their native one (such as Spanish, French, or German), it has been shown that they can learn their target language more easily if they can get help from both their native language and English simultaneously. 

For this reason, I decided to write this translator, which provides results in two languages at once. I hope it will be helpful to everyone who is trying to learn a foreign language


INSTALLATION : For ChromeExtentions --> Download chromeExtention folder and see Double Translate Chrome.gif

INSTALLATION (Windows):

1. npm i (dont update packages)
2. npm start
3. npm run build
4. npm run package
