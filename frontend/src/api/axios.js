// Alias so sport pages using `import axiosInstance from "../../api/axios"` work
// without modification. The underlying instance already attaches the JWT Bearer
// token via the interceptor in config/api.js.
import api from '../config/api';
export default api;
