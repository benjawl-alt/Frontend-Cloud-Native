# Pedidos360 - Frontend Cloud Native

## Sobre el proyecto

Pedidos360 es un proyecto que desarrollamos para la asignatura de Desarrollo Cloud Native I 

Nuestra aplicación está enfocada en la venta y gestión de productos de panadería y pastelería. La idea principal es que los clientes puedan revisar los productos disponibles, agregarlos al carrito, realizar pedidos y consultar sus compras anteriores

También contamos con un panel de administración, desde el cual se pueden gestionar los productos, revisar los pedidos realizados y consultar estadísticas de ventas e inventario

Para el desarrollo utilizamos Angular en el frontend, trabajando con los distintos microservicios del backend y utilizando servicios en la nube

## Integrantes

- Benjamín Vásquez
- Dante Muñoz
- Carlo Fuentes
- Alejandro Salazar

## Tecnologías utilizadas

Para desarrollar nuestro proyecto utilizamos las siguientes tecnologías:

- Angular
- TypeScript
- HTML
- CSS
- RxJS
- Microsoft Entra ID
- MSAL
- AWS API Gateway
- API REST
- Kafka Streams (integración con el backend)
- Vitest
- Node.js y npm
- Git y GitHub

## Funcionalidades del proyecto

### Cliente

- Iniciar y cerrar sesión con una cuenta Microsoft
- Visualizar los productos disponibles
- Consultar precios y stock
- Agregar productos al carrito de compras
- Modificar las cantidades de los productos
- Eliminar productos del carrito
- Realizar pedidos
- Revisar el historial de compras
- Consultar el estado de los pedidos

### Administrador

- Agregar nuevos productos al catálogo
- Editar productos existentes
- Eliminar productos
- Revisar el stock disponible
- Visualizar los pedidos realizados por los clientes
- Consultar estadísticas de ventas
- Visualizar alertas de stock bajo
- Revisar los productos más vendidos

## Arquitectura del proyecto

Nuestro proyecto trabaja con una arquitectura de microservicios, donde tenemos separado el frontend del backend

El frontend se encarga de toda la parte visual y de la interacción con el usuario, mientras que los microservicios se encargan de procesar las solicitudes, gestionar los productos y registrar los pedidos

En el entorno de producción utilizamos AWS API Gateway para comunicarnos con los servicios del backend

También utilizamos Microsoft Entra ID para la autenticación de los usuarios

## Integración con Kafka Streams

Dentro del panel administrativo incorporamos indicadores relacionados con las ventas y el inventario

Estos indicadores permiten visualizar información como:

- Cantidad total de pedidos
- Total de ventas
- Ticket promedio
- Productos disponibles
- Productos sin stock
- Alertas de stock bajo
- Ranking de los cinco productos más vendidos

Kafka Streams se encuentra asociado al procesamiento de información en el backend. Desde Angular consultamos los resultados mediante solicitudes HTTP y mostramos la información en el panel administrativo

## Autenticación

Para el inicio de sesión utilizamos Microsoft Entra ID mediante la biblioteca MSAL

Esto nos permite identificar al usuario que está utilizando la aplicación y obtener los tokens necesarios para comunicarnos con los servicios protegidos del backend

También diferenciamos las funcionalidades del cliente y del administrador según el rol del usuario. La validación de los permisos se debe realizar en el backend

## Estructura del proyecto

El frontend está organizado de la siguiente manera:

```text
Frontend-Cloud-Native/
│
├── README.md
└── frontend/
    ├── public/
    │   └── images/
    ├── src/
    │   ├── app/
    │   │   ├── admin/
    │   │   ├── home/
    │   │   ├── login/
    │   │   ├── mis-pedidos/
    │   │   ├── productos/
    │   │   ├── service/
    │   │   ├── cart.service.ts
    │   │   ├── app.config.ts
    │   │   └── app.routes.ts
    │   ├── environments/
    │   ├── main.ts
    │   └── styles.css
    ├── angular.json
    ├── package.json
    └── package-lock.json
```

Organizamos las carpetas según las funcionalidades de la aplicación para que sea más fácil trabajar en equipo, mantener el código y realizar modificaciones

## Requisitos para ejecutar el proyecto

Antes de ejecutar la aplicación es necesario tener instalado:

- Node.js compatible con Angular
- npm
- Git
- Visual Studio Code o algún editor de código

Además, los servicios del backend deben estar disponibles para que funcionen correctamente todas las funcionalidades de la aplicación

## Instalación y ejecución

Primero se debe clonar el repositorio utilizando el enlace de GitHub

```bash
git clone https://github.com/benjawl-alt/Frontend-Cloud-Native.git
```

Luego debemos ingresar a la carpeta del frontend

```bash
cd frontend
```

Instalamos las dependencias del proyecto

```bash
npm ci
```

Una vez instaladas las dependencias, ejecutamos la aplicación

```bash
npm start
```

Finalmente, ingresamos desde el navegador a:

```text
http://localhost:4200
```

## Configuración del entorno

Dentro de la carpeta `src/environments` se encuentran los archivos de configuración que utilizamos para establecer la comunicación con el backend

Contamos con configuraciones para trabajar tanto de manera local como en producción

Para el entorno local se utilizan las siguientes direcciones:

| Servicio | Dirección |
|---|---|
| Frontend | http://localhost:4200 |
| Microservicio de pedidos | http://localhost:8081/api/orders |
| Microservicio de productos | http://localhost:8082/api/products |

En producción, las solicitudes se realizan mediante las direcciones configuradas de AWS API Gateway

## Comunicación con el backend

Para comunicarnos con nuestros microservicios utilizamos solicitudes HTTP mediante API REST

Algunos de los endpoints utilizados en el proyecto son:

| Método | Endpoint | Función |
|---|---|---|
| GET | /api/products | Obtener productos |
| POST | /api/products | Crear un producto |
| PUT | /api/products/{id} | Editar un producto |
| DELETE | /api/products/{id} | Eliminar un producto |
| GET | /api/orders | Obtener pedidos |
| POST | /api/orders | Crear un pedido |
| GET | /api/orders/mine | Consultar mis pedidos |
| GET | /api/orders/stream/alerts | Consultar alertas de stock |
| GET | /api/orders/stream/top-products | Consultar productos más vendidos |

## Carrito de compras

Para el carrito de compras creamos un servicio que se encarga de gestionar los productos seleccionados por el cliente

Desde este servicio podemos agregar y eliminar productos, modificar las cantidades y calcular el total de la compra

Una vez que el usuario confirma su compra, la información se envía al microservicio de pedidos para realizar el registro correspondiente

## Compilación

Para generar la compilación del proyecto utilizamos el siguiente comando:

```bash
npm run build
```

Los archivos generados se almacenan dentro de la carpeta `dist`

## Pruebas

Para ejecutar las pruebas unitarias disponibles en el proyecto utilizamos:

```bash
npm test
```

## Trabajo en equipo

Durante el desarrollo utilizamos Git y GitHub para organizar nuestro trabajo. Cada integrante pudo trabajar en distintas funcionalidades mediante ramas, realizar commits y posteriormente integrar los cambios al proyecto

Esto nos permitió mantener un registro de las modificaciones y trabajar de manera colaborativa sin tener que modificar todos los mismos archivos al mismo tiempo

## Mejoras futuras

Algunas mejoras que nos gustaría incorporar más adelante son:

- Mejorar el diseño y la experiencia del usuario
- Incorporar notificaciones en tiempo real
- Agregar más estadísticas al panel administrativo
- Mejorar la seguridad de las rutas
- Incorporar más pruebas automatizadas
- Automatizar los procesos de despliegue

## Consideraciones

Este repositorio corresponde solamente al frontend de Pedidos360. Para utilizar todas las funcionalidades es necesario contar con los microservicios del backend y la configuración de los servicios en la nube

## Conclusión

Con este proyecto pudimos aplicar los contenidos trabajados durante la asignatura, principalmente la arquitectura de microservicios, el consumo de APIs, la autenticación de usuarios, la integración con servicios en la nube y el procesamiento de información mediante Kafka Streams

También nos permitió mejorar nuestra forma de trabajar en equipo, organizar el código y entender cómo se comunican los distintos componentes de una aplicación Cloud Native

---

Proyecto desarrollado por estudiantes de Ingeniería en Informática
Duoc UC - 2026

Asignatura: Desarrollo Cloud Native I (DSY1107)
