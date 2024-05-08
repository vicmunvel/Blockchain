# Blockchain
Repositorio para llevar un control del proyecto Loteria Financiera V&amp;D

Una vez descargado el proyecto abrir una terminal en la ruta del mismo y poner por consola (previa instalacion de Node.js):
- npm install package.json
Esto nos servirá para instalar en nuestro equipo las dependencias que necesita nuesto proyecto.

Seguidamente, una vez termine el proceso, realizar el siguiente comando:
- npm migrate --reset (--network ganache)
Esto nos va a permitir llevar a cabo los despliegues de los contratos de nuestro proyecto automáticamente.

Por último, ejecutamos el siguiente comando para arrancar la interfaz gráfica:
- npm start

Revisar el fichero truffle-config.js para consultar que red estamos utilizando, si queremos emplear la de Ganache habria que definirla ahi, arrancar el servicio en nuestro equipo y especificar dicha red en el comando de despliegue si fuera necesario.
