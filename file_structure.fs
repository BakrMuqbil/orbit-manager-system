├── □ ai-llm-api/-
│   ├── □ app/-
│   │   ├── □ api/-
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   ├── □ core/-
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── logger.py
│   │   ├── □ schemas/-
│   │   │   ├── __init__.py
│   │   │   └── request_response.py
│   │   ├── □ services/-
│   │   │   ├── __init__.py
│   │   │   └── llm_service.py
│   │   ├── □ utils/-
│   │   │   ├── __init__.py
│   │   │   └── prompt_builder.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── □ tests/-
│   │   └── test_api.py
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── README.md
│   └── requirements.txt
├── □ ai-sentiment-analyzer/-
│   ├── □ app/-
│   │   ├── □ api/-
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   ├── □ core/-
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── logger.py
│   │   ├── □ services/-
│   │   │   ├── __init__.py
│   │   │   ├── agent_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── memory_service.py
│   │   │   ├── tools.py
│   │   │   └── vector_service.py
│   │   ├── □ utils/-
│   │   │   ├── __init__.py
│   │   │   └── prompt_builder.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── □ data/-
│   │   └── info.txt
│   ├── □ static/-
│   │   └── index.html
│   ├── □ tests/-
│   │   └── test_api.py
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── log.txt
│   ├── README.md
│   ├── requirements.txt
│   ├── test_trello.py
│   └── vercel.json
├── □ ai-smart-helper/-
│   ├── □ app/-
│   │   ├── □ api/-
│   │   │   ├── □ routes/-
│   │   │   │   ├── __init__.py
│   │   │   │   ├── doctor.py
│   │   │   │   ├── food.py
│   │   │   │   └── patient.py
│   │   │   └── __init__.py
│   │   ├── □ core/-
│   │   │   ├── __init__.py
│   │   │   ├── confidence_scorer.py
│   │   │   ├── deterministic_calculator.py
│   │   │   ├── explainability.py
│   │   │   ├── llm_extractor.py
│   │   │   ├── permission_layer.py
│   │   │   └── safety_escalation.py
│   │   ├── □ db/-
│   │   │   ├── □ repositories/-
│   │   │   │   ├── __init__.py
│   │   │   │   ├── audit_replay.py
│   │   │   │   ├── food_log_repo.py
│   │   │   │   └── patient_repo.py
│   │   │   ├── __init__.py
│   │   │   └── database.py
│   │   ├── □ frontend/-
│   │   │   ├── □ components/-
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── sidebar.py
│   │   │   │   └── tables.py
│   │   │   ├── □ utils/-
│   │   │   │   ├── __init__.py
│   │   │   │   ├── db_utils.py
│   │   │   │   ├── file_utils.py
│   │   │   │   └── version_utils.py
│   │   │   ├── □ views/-
│   │   │   │   ├── __init__.py
│   │   │   │   ├── audit.py
│   │   │   │   ├── conversations.py
│   │   │   │   ├── food_log.py
│   │   │   │   ├── home.py
│   │   │   │   ├── knowledge.py
│   │   │   │   ├── patients.py
│   │   │   │   ├── settings.py
│   │   │   │   └── versions.py
│   │   │   ├── __init__.py
│   │   │   └── doctor_dashboard.py
│   │   ├── □ models/-
│   │   │   ├── __init__.py
│   │   │   ├── audit.py
│   │   │   ├── food.py
│   │   │   └── patient.py
│   │   ├── □ services/-
│   │   │   ├── __init__.py
│   │   │   ├── agent_service.py
│   │   │   ├── calculator_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── memory_service.py
│   │   │   ├── patient_context.py
│   │   │   └── tools.py
│   │   ├── □ utils/-
│   │   │   ├── __init__.py
│   │   │   ├── food_parser.py
│   │   │   ├── prompt_builder.py
│   │   │   └── validators.py
│   │   ├── __init__.py
│   │   ├── doctor_dashboard.py
│   │   ├── main_cli.py
│   │   └── main.py
│   ├── □ config/-
│   │   ├── __init__.py
│   │   ├── doctor_permissions.json
│   │   ├── doctor_personality.yaml
│   │   └── general_knowledge.yaml
│   ├── □ patients/-
│   │   └── □ patient_001/-
│   │       ├── □ history/-
│   │       │   ├── diet_v1.json
│   │       │   ├── diet_v2.json
│   │       │   ├── profile_v1.json
│   │       │   ├── profile_v2.json
│   │       │   ├── weight_v1.json
│   │       │   ├── weight_v2.json
│   │       │   └── weight_v3.json
│   │       ├── conversations.db
│   │       ├── diet_plan.json
│   │       ├── food_log.db
│   │       └── profile.json
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── create_test_versions.py
│   ├── docker-compose.yml
│   ├── organizer.py
│   ├── README.md
│   ├── requirements.txt
│   └── setup.sh
├── □ E-commerce-NEXT-APP/-
│   ├── □ .next/-
│   │   ├── □ cache/-
│   │   │   ├── □ eslint/-
│   │   │   │   └── .cache_h7jg1c
│   │   │   └── next-server.js.nft.json
│   │   ├── □ server/-
│   │   │   ├── □ pages/-
│   │   │   │   ├── □ api/-
│   │   │   │   │   └── □ admin/-
│   │   │   │   │       └── category.js
│   │   │   │   ├── □ frontend/-
│   │   │   │   │   └── landing.js
│   │   │   │   ├── _app.js
│   │   │   │   ├── _document.js
│   │   │   │   ├── _error.js
│   │   │   │   └── index.js
│   │   │   ├── font-loader-manifest.js
│   │   │   ├── font-loader-manifest.json
│   │   │   ├── middleware-build-manifest.js
│   │   │   ├── middleware-manifest.json
│   │   │   ├── middleware-react-loadable-manifest.js
│   │   │   ├── pages-manifest.json
│   │   │   ├── webpack-api-runtime.js
│   │   │   └── webpack-runtime.js
│   │   ├── □ static/-
│   │   │   ├── □ chunks/-
│   │   │   │   ├── □ pages/-
│   │   │   │   │   ├── □ frontend/-
│   │   │   │   │   │   └── landing.js
│   │   │   │   │   ├── _app.js
│   │   │   │   │   ├── _error.js
│   │   │   │   │   └── index.js
│   │   │   │   ├── amp.js
│   │   │   │   ├── main.js
│   │   │   │   ├── polyfills.js
│   │   │   │   ├── react-refresh.js
│   │   │   │   └── webpack.js
│   │   │   ├── □ development/-
│   │   │   │   ├── _buildManifest.js
│   │   │   │   └── _ssgManifest.js
│   │   │   └── □ webpack/-
│   │   │       ├── □ pages/-
│   │   │       │   └── _app.c9abff4c891155a2.hot-update.js
│   │   │       ├── 203e0f241aaa0870.webpack.hot-update.json
│   │   │       ├── c9abff4c891155a2.webpack.hot-update.json
│   │   │       ├── f7e6e19b3cc80408.webpack.hot-update.json
│   │   │       ├── webpack.203e0f241aaa0870.hot-update.js
│   │   │       ├── webpack.c9abff4c891155a2.hot-update.js
│   │   │       └── webpack.f7e6e19b3cc80408.hot-update.js
│   │   ├── build-manifest.json
│   │   ├── package.json
│   │   ├── react-loadable-manifest.json
│   │   └── trace
│   ├── □ components/-
│   │   ├── CartCard.jsx
│   │   ├── CatCard.jsx
│   │   ├── Categories.jsx
│   │   ├── Intro.jsx
│   │   ├── ProdCard.jsx
│   │   └── Products.jsx
│   ├── □ models/-
│   │   ├── Cart.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── □ pages/-
│   │   ├── □ admin/-
│   │   │   ├── □ components/-
│   │   │   │   ├── Profile.jsx
│   │   │   │   └── Sidebar_com.jsx
│   │   │   ├── □ products/-
│   │   │   │   ├── □ updateProducts/-
│   │   │   │   │   └── [id].jsx
│   │   │   │   ├── addProduct.jsx
│   │   │   │   └── getProducts.jsx
│   │   │   ├── □ updateCategory/-
│   │   │   │   └── [id].jsx
│   │   │   ├── □ viewOrder/-
│   │   │   │   └── [id].jsx
│   │   │   ├── addCategory.jsx
│   │   │   ├── categories.jsx
│   │   │   ├── dashboard.jsx
│   │   │   ├── orders.jsx
│   │   │   └── User.jsx
│   │   ├── □ api/-
│   │   │   ├── □ admin/-
│   │   │   │   ├── category.js
│   │   │   │   ├── getCategoryById.js
│   │   │   │   ├── getProductByID.js
│   │   │   │   ├── product.js
│   │   │   │   └── user.js
│   │   │   ├── □ auth/-
│   │   │   │   ├── login_user.js
│   │   │   │   └── register_user.js
│   │   │   ├── □ frontend/-
│   │   │   │   ├── cart.js
│   │   │   │   ├── getProductByCategory.js
│   │   │   │   └── order.js
│   │   │   └── hello.js
│   │   ├── □ components/-
│   │   │   ├── Footer.jsx
│   │   │   └── Navbar.jsx
│   │   ├── □ frontend/-
│   │   │   ├── □ product/-
│   │   │   │   └── [id].jsx
│   │   │   ├── □ viewProductByCategories/-
│   │   │   │   └── [id].jsx
│   │   │   ├── cart.jsx
│   │   │   ├── landing.jsx
│   │   │   ├── my-orders.jsx
│   │   │   ├── payment.jsx
│   │   │   └── shop.jsx
│   │   ├── _app.js
│   │   ├── _document.js
│   │   ├── index.js
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── □ public/-
│   │   ├── favicon.ico
│   │   ├── Itntro.jpg
│   │   ├── next.svg
│   │   ├── opogo.png
│   │   ├── thirteen.svg
│   │   └── vercel.svg
│   ├── □ services/-
│   │   └── admin.js
│   ├── □ Slices/-
│   │   └── cartSlice.js
│   ├── □ store/-
│   │   └── store.js
│   ├── □ styles/-
│   │   └── globals.css
│   ├── □ utils/-
│   │   └── connectDB.js
│   ├── .env.local
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── jsconfig.json
│   ├── next.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   └── tailwind.config.js
├── □ land-solar/-
│   ├── □ public/-
│   │   ├── favicon.svg
│   │   ├── header.png
│   │   ├── icons.svg
│   │   └── logo.png
│   ├── □ src/-
│   │   ├── □ assets/-
│   │   │   ├── □ fonts/-
│   │   │   │   └── Amiri.ttf
│   │   │   ├── logoPdf.jpg
│   │   │   └── vite.svg
│   │   ├── □ components/-
│   │   │   ├── □ ui/-
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── InputGroup.jsx
│   │   │   │   ├── Stepper.jsx
│   │   │   │   └── ui.module.css
│   │   │   ├── calculator.module.css
│   │   │   ├── form.module.css
│   │   │   ├── SolarCalculator.jsx
│   │   │   ├── SolarForm.jsx
│   │   │   ├── step.module.css
│   │   │   ├── StepCustomerInfo.jsx
│   │   │   ├── StepDeviceList.jsx
│   │   │   └── StepPanelSelection.jsx
│   │   ├── □ constants/-
│   │   │   ├── data.js
│   │   │   ├── devices.js
│   │   │   └── panels.js
│   │   ├── □ pages/-
│   │   │   └── CalculatorPage.jsx
│   │   ├── □ utils/-
│   │   │   ├── mailer.js
│   │   │   ├── pdfGenerator.js
│   │   │   └── solarCalculations.js
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── server.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── vite.config.js
├── □ Orbit/-
│   ├── □ .vercel/-
│   │   ├── project.json
│   │   └── README.txt
│   ├── □ css/-
│   │   ├── login-style.css
│   │   └── style.css
│   ├── □ server/-
│   │   ├── auth.js
│   │   ├── authMiddleware.js
│   │   └── index.js
│   ├── □ src/-
│   │   ├── □ assets/-
│   │   │   ├── □ images/-
│   │   │   │   ├── logo.png
│   │   │   │   ├── Orbit.png
│   │   │   │   ├── OrbitLogo.jpg
│   │   │   │   ├── OrbitMani.png
│   │   │   │   └── profile-img.jpg
│   │   │   ├── logo.png
│   │   │   └── vite.svg
│   │   ├── □ components/-
│   │   │   ├── □ BusLedger/-
│   │   │   │   ├── BusLedger.jsx
│   │   │   │   └── BusLedger.module.css
│   │   │   ├── □ BusManager/-
│   │   │   │   ├── BusManager.css
│   │   │   │   └── BusManager.jsx
│   │   │   ├── □ CompaniesManager/-
│   │   │   │   ├── CompaniesManager.jsx
│   │   │   │   └── CompaniesManager.module.css
│   │   │   ├── □ DriverLedger/-
│   │   │   │   ├── DriverLedger.css
│   │   │   │   └── DriverLedger.jsx
│   │   │   ├── □ DriverManager/-
│   │   │   │   ├── DriverManager.jsx
│   │   │   │   └── DriverManager.module.css
│   │   │   ├── □ InputField/-
│   │   │   │   └── InputField.jsx
│   │   │   ├── □ Sidebar/-
│   │   │   │   ├── Sidebar_1.jsx
│   │   │   │   ├── Sidebar.css
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Sidebar.module.css
│   │   │   ├── □ UsersManager/-
│   │   │   │   ├── UsersManager.jsx
│   │   │   │   └── UsersManager.module.css
│   │   │   ├── UniversalModal.css
│   │   │   └── UniversalModal.jsx
│   │   ├── □ constants/-
│   │   │   └── formSchemas.js
│   │   ├── □ data/-
│   │   │   └── users.json
│   │   ├── □ library/-
│   │   │   ├── items.jsx
│   │   │   └── items.module.css
│   │   ├── □ pages/-
│   │   │   ├── □ Dashboard/-
│   │   │   │   ├── AccountantStats.css
│   │   │   │   ├── AccountantStats.jsx
│   │   │   │   ├── AdminStats.jsx
│   │   │   │   ├── AdminStats.module.css
│   │   │   │   ├── Dashboard.css
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── □ Home/-
│   │   │   │   ├── home.css
│   │   │   │   └── home.jsx
│   │   │   └── □ Login/-
│   │   │       ├── login.css
│   │   │       ├── login.jsx
│   │   │       └── login.module.css
│   │   ├── □ utils/-
│   │   │   └── apiService.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── .env
│   ├── .gitignore
│   ├── db.js
│   ├── file_structure.fs
│   ├── file_structure.fs (2)
│   ├── filebrowser.db
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── script.js
│   ├── vercel.json
│   └── vite.config.js
└── □ System-of-Solar/-
    ├── □ public/-
    │   ├── favicon.svg
    │   ├── header.png
    │   ├── icons.svg
    │   └── logo.png
    ├── □ src/-
    │   ├── □ assets/-
    │   │   └── vite.svg
    │   ├── □ components/-
    │   │   ├── □ ui/-
    │   │   │   ├── Button.jsx
    │   │   │   ├── InputGroup.jsx
    │   │   │   ├── Stepper.jsx
    │   │   │   └── ui.module.css
    │   │   ├── calculator.module.css
    │   │   ├── form.module.css
    │   │   ├── SolarCalculator.jsx
    │   │   ├── SolarForm.jsx
    │   │   ├── step.module.css
    │   │   ├── StepCustomerInfo.jsx
    │   │   ├── StepDeviceList.jsx
    │   │   └── StepPanelSelection.jsx
    │   ├── □ constants/-
    │   │   ├── data.js
    │   │   ├── devices.js
    │   │   └── panels.js
    │   ├── □ pages/-
    │   │   └── CalculatorPage.jsx
    │   ├── □ utils/-
    │   │   └── solarCalculations.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    └── vite.config.js
