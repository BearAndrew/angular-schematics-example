# Schematic Example

使用方法:
```shell
npm i
ng build my-lib
cd projects/my-lib
npm run build
cd ../..
npm link dist\my-lib\
ng generate my-lib:component-01 --name home
ng s
URL: localhost:4200/home
```
