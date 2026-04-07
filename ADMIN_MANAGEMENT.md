# Admin Dashboard - User & Role Management Guide

## 🎯 How to Make a User an Admin

There are **3 methods** to promote a user to Admin:

---

## **Method 1: MongoDB Atlas Direct Update (Recommended for First Admin)**

### Steps:
1. Go to **MongoDB Atlas** (mongodb.com)
2. Click your **Cluster** → **Browse Collections**
3. Open **unihub** database → **users** collection
4. Find the user you want to promote
5. Click **Edit** button
6. Change `role` field from `"user"` to `"admin"`
7. Click **Update**

### Example:
```json
Before:
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}

After:
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

---

## **Method 2: Backend API Endpoint (To be implemented)**

Once this endpoint is created, admins can promote users:

```bash
PUT /api/users/:userId/role
Body: { "role": "admin" }
```

---

## **Method 3: Backend Command Line**

Run this Node.js command to promote a user:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const user = await User.findOneAndUpdate(
    { email: 'user@email.com' },
    { role: 'admin' },
    { new: true }
  );
  console.log('User promoted:', user.name, 'is now admin');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
"
```

---

## 🔐 Role-Based Access Control

```
┌─────────────────────────────────────────────┐
│         USER LOGS IN                        │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ↓                       ↓
    role = "user"          role = "admin"
         │                       │
    USER DASHBOARD         ADMIN DASHBOARD
    ├─ Home                 ├─ Dashboard
    ├─ My Events            ├─ Manage Events (Create/Edit/Delete)
    ├─ Cart                 ├─ View Users
    └─ Profile              └─ Profile (Admin badge)
```

---

## 📊 Admin vs User Features

| Feature | User | Admin |
|---------|------|-------|
| Browse Events | ✅ | ✅ |
| Register for Events | ✅ | ❌ |
| Buy Tickets | ✅ | ❌ |
| Create Events | ❌ | ✅ |
| Edit Events | ❌ | ✅ |
| Delete Events | ❌ | ✅ |
| View All Users | ❌ | ✅ |
| View Dashboard Stats | ✅ | ✅ |

---

## 🚀 Quick Start - Admin Promotion

### Step-by-step:

1. **User registers** (any user can register)
   - User is set to `role: "user"` by default

2. **You promote to Admin** via MongoDB Atlas
   - Open user record in collection
   - Change `role` to `"admin"`

3. **Admin logs in**
   - Sees **Admin Dashboard**
   - Can create/manage events
   - Cannot register for events (admin-only accounts)

4. **Regular user logs in**
   - Sees **User Dashboard**
   - Can browse events
   - Can register and buy tickets

---

## 🧪 Test Both Roles

### User Account:
1. Register: `user@unihub.com` | ID: `2024001`
2. Login → See User Dashboard
3. Browse events, register, buy tickets

### Admin Account:
1. Register: `admin@unihub.com` | ID: `2024999`
2. Go to MongoDB Atlas → Promote to admin
3. Login → See Admin Dashboard
4. Create/manage events, view stats

---

## 📝 Database Schema

User document with role:
```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@unihub.com",
  "password": "hashed_password",
  "studentId": "2024001",
  "department": "CS",
  "year": 3,
  "phone": "+94771234567",
  "role": "user",           // ← Change this to "admin"
  "registeredAt": ISODate("2026-03-26")
}
```

---

## 🔒 Security Notes

- ✅ Password is hashed (bcryptjs)
- ✅ JWT tokens used for auth
- ✅ Admin endpoints should validate role in middleware (todo)
- ✅ Email & Student ID are unique
- ⚠️ Currently: Anyone can create events (Should require admin role - backend middleware todo)

---

## 🛠️ Future Enhancements

- [ ] Admin can promote/demote users from dashboard
- [ ] Admin can delete/suspend users
- [ ] Audit logs for admin actions
- [ ] Email verification for new accounts
- [ ] Two-factor authentication for admins

---

## ❓ FAQ

**Q: Can an admin register for events?**  
A: Currently, the system allows it, but UI shows separate dashboards.

**Q: Can a user become admin later?**  
A: Yes, manually via MongoDB Atlas or future API endpoint.

**Q: What happens to user's events if demoted?**  
A: Their registrations are kept, but they won't see admin panel anymore.

**Q: Is there a super-admin?**  
A: Not yet. All admins have equal permissions.

---

## 📞 Support

For issues or questions about admin roles:
1. Check MongoDB collections
2. Verify `role` field is set correctly
3. Clear browser cache and re-login
4. Check backend logs for errors
