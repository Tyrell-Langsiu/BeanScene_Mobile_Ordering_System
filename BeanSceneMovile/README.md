# Workflow
Bean Scene would also like staff to be able to take orders using the restaurant’s Android tablets using a separate mobile application. This system will not be available to guests and will only be used from the prescribed mobile devices. The ordering system will allow waitstaff to take orders from guests and kitchen staff to view and fulfil the orders. The ordering system will need to allow staff to: View menu items available for ordering: Browse by category: entrées, mains, desserts, drinks, sides, specials Search for menu items Place an order for a table, capturing: A table reference (as shown in Table 1 Restaurant areas & tables) List of menu items including additional information such as dietary requirements, and special requests. Date and time of order Status (in-progress, completed) Notes The ordering system will need to allow managers: Manage menu items (add/edit/delete) Manage menu item categories (add/edit/delete) Manage staff accounts (add/edit/delete) View reports giving an overview/summary of order activity (e.g. in-progress vs completed orders) Menu items Each menu item may have: Name Description (including ingredients) Price Photo (optional) Dietary flags (e.g. gluten free, vegetarian, vegan, allergens) Availability (available/unavailable due to ingredients) Authentication and Authorisation The system will have two different types of users as listed below: Manager: The manager has the highest level of access and is responsible for placing orders, viewing orders, adding/editing/deleting menu items and categories, managing staff accounts, and viewing reports. Staff: A standard staff member can only place orders and view orders. Access to other functionality must be restricted. Connectivity and security The ordering system should use a REST API for future compatibility with appropriate security (e.g. authentication & authorisation) applied to disable unauthorised access. The ordering system should make use of local storage/caching on the mobile device to allow browsing/viewing of menu items when the network connection is lost. A message should be displayed to notify the staff that the network connection is lost. Usability The ordering system should be easy to use for non-technical users, including intuitive user interface (UI) design and patterns, especially considering navigation and gestures. Appropriate messages should be provided throughout the application to guide the user, including error and success messages. Target devices Bean Scene currently has some Android tablets that they would like to use for the ordering system. The mobile application should work on both small and large tablets, as it is likely that waitstaff may use smaller tablets (for portability) whereas kitchen staff and managers may use larger tablets for readability. The mobile application should work in both portrait and landscape orientations.

# Requirements
IDE usage ⦁ Installing and configuring development tools (e.g. IDEs, runtimes, testing tools). Include screenshots showing the setup of each main development tool used for the project. IDE – Visual Studio Code Runtime Testing tools

⦁ Use of an IDE to manage a project of multiple source code files.

⦁ Use of IDE automation facilities E.g. building source code files.

 Table Development – General development General development ⦁ Responding to non-UI events. E.g. load/lifecycle, error, network connectivity, async callbacks. At least 3 examples.

⦁ Responding to taps, touches, and gestures. At least 3 examples.

⦁ Use of auto-rotation and/or auto-resizing functionality.

⦁ Use of classes/objects. At least 3 examples.

⦁ Use of modular programming. At least 2 examples. Include 1 example of passing a parameter "by reference".

⦁ Use of asynchronous code execution.

⦁ Use of a third-party library.

⦁ Use of hashing techniques. E.g. password/token hashing, file/value hashing.

⦁ Use of proper memory management techniques to avoid memory leaks. E.g. closing connections and processes when finished.

 Table Development – Data structures Data structures ⦁ Use of a user-defined data structure made up of other data types. E.g. object containing properties of different data types.

⦁ Use of a 2D data structure. E.g. a list/array/collection.

⦁ Use of dynamic data structures with internal linking. E.g. Double-linked list, binary tree.

 Table Development – Sorting, searching, and filtering Sorting, searching, and filtering ⦁ Use of a custom sort on a data structure. E.g. a case-insensitive, accent-insensitive sort on names.

⦁ Searching a complex data structure for an item. E.g. searching for a user-defined object in a collection using a binary search.

 Table Development – API development API development ⦁ Use of a REST API that provides data used by a client application.

⦁ Use of a REST API to synchronise data between client and server. E.g. get, update, add, delete.

⦁ Implementation of REST API endpoints: ⦁ GET (single and multiple records) ⦁ POST ⦁ PUT ⦁ DELETE

⦁ Use of appropriate HTTP status codes. E.g. 404 Not Found, 400 Bad Request, 200 OK

⦁ Enabling and use of CORS making use of pre-flight cross-origin requests using the OPTION method. Show network request/response data demonstrating CORS and pre-flight request.

⦁ Implementation of REST API security (authentication and authorisation). E.g. use of tokens or passwords to protect resources.

 Table Development – File system and local databases File system and local databases ⦁ Use of a mobile client's file system to read & write files using random access. E.g. reading and writing a specific file on disk.

⦁ Use of a local database facility on a mobile client. E.g. local storage such as key-value pairs, SQLite, AsyncStorage, etc.

 Table Development – Debugging, testing, and optimisation Debugging, testing, and optimisation ⦁ Use of standalone debugging tools (not built into IDE). E.g. browsers, externals devices, API testing tools, etc.

⦁ Use of IDE-based debugging tools to trace code execution and examine variable contents.

⦁ Give examples of syntax, logical, and design errors that you have fixed in your code (before & after). At least 3 examples.

⦁ Implementation of code optimisation. E.g. refactoring code to make it faster or more maintainable, fixing memory leaks. At least 2 examples.

 Table Development – Documentation and standards Documentation and standards ⦁ Documentation of source code using a standard that is human-readable and machine-readable. E.g. JSDoc, .NET XML documentation, etc.

⦁ Documentation for the REST API endpoints. E.g. Swagger. Swagger or any other tool.