<template>
  <div class="dashboard-container">

    <div v-if="isLoading" class="global-loader">
      <div class="global-spinner"></div>
    </div>

    <div :class="['custom-confirm-overlay', { active: showConfirm }]">
      <div class="confirm-box">
        <div :class="['c-icon', confirmData.type]" v-html="confirmData.icon"></div>
        <h3 style="color:var(--text-main); font-size:20px; margin-bottom:10px;">{{ confirmData.title }}</h3>
        <p style="color:var(--text-muted); font-size:14px; line-height:1.5;">{{ confirmData.desc }}</p>
        <div class="c-actions">
          <button class="c-btn cancel" @click="resolveConfirm(false)">Cancel</button>
          <button class="c-btn confirm" :style="confirmData.btnStyle" @click="resolveConfirm(true)">{{
            confirmData.btnText }}</button>
        </div>
      </div>
    </div>

    <div :class="['bulk-bar', { show: selectedRequestIds.length > 0 }]">
      <span style="color:white; font-weight:600; font-size:14px; margin-right:10px;">
        <span style="color:#10b981; font-size:16px;">{{ selectedRequestIds.length }}</span> Requests Selected
      </span>
      <div style="height:20px; width:1px; background:rgba(255,255,255,0.1);"></div>
      <button class="bulk-btn approve" @click="bulkApprove" title="Approve Selected"><i
          class="fas fa-check"></i></button>
      <button class="bulk-btn reject" @click="bulkReject" title="Reject Selected"><i class="fas fa-times"></i></button>
    </div>

    <div :class="['sidebar-backdrop', { show: isSidebarOpen }]" @click="isSidebarOpen = false"></div>

    <aside :class="['sidebar', { open: isSidebarOpen }]">
      <div class="brand">
        <i class="fas fa-feather-alt"></i><span>LibraryOS</span>
        <i class="fas fa-times mobile-close-btn" @click="isSidebarOpen = false"></i>
      </div>
      <div class="nav-label">Main Menu</div>
      <nav>
        <a v-for="item in navItems" :key="item.view" href="#"
          :class="['nav-item', { active: currentView === item.view }]" @click.prevent="switchView(item.view)">
          <i :class="item.icon"></i> {{ item.label }}
        </a>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout"><i class="fas fa-sign-out-alt"></i> Log Out</button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div style="display: flex; align-items: center; gap: 15px;">
          <i class="fas fa-bars mobile-menu-btn" @click="isSidebarOpen = true"></i>
          <div class="header-text">
            <h2>{{ pageHeading }}</h2>
            <p>{{ currentDateStr }}</p>
          </div>
        </div>

        <div class="admin-profile" style="position:relative;">
          <div class="notif-bell" @click="toggleTheme" style="margin-right: 15px;">
            <i class="fas" :class="isLightMode ? 'fa-moon' : 'fa-sun'"></i>
          </div>

          <div class="notif-bell" @click="showNotifDropdown = !showNotifDropdown">
            <i class="far fa-bell"></i>
            <span class="dot" v-if="pendingNotifications.length > 0"></span>
          </div>
          <div :class="['notif-dropdown', { show: showNotifDropdown }]">
            <div class="notif-header">Pending Requests</div>
            <div class="notif-list">
              <div v-if="pendingNotifications.length === 0" class="empty-notif">No pending requests</div>
              <div v-for="(r, i) in pendingNotifications" :key="r.id" class="notif-item" @click="openQuickModal(i)">
                <div class="notif-icon"><i :class="r.status === 'return_pending' ? 'fas fa-undo' : 'fas fa-book'"></i>
                </div>
                <div class="notif-content">
                  <div><strong>{{ r.user_email?.split('@')[0] }}</strong> {{ r.status === 'return_pending' ? 'wants to return ' : 'requested access' }}</div>
                  <span>{{ r.book_title }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="profile-info desktop-only">
            <span class="p-name">Administrator</span>
            <span class="p-role">Super Admin</span>
          </div>
          <div class="avatar"></div>
        </div>
      </header>

      <div v-show="currentView === 'overview'" :class="['view-section', { active: currentView === 'overview' }]">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-top"><span class="stat-label">Total Books</span><i class="fas fa-book i-gold"></i></div>
            <h1>{{ books.length }}</h1>
            <span class="stat-sub text-up"><i class="fas fa-arrow-up"></i> 12% this month</span>
          </div>
          <div class="stat-card">
            <div class="stat-top"><span class="stat-label">Total Users</span><i class="fas fa-user-friends i-blue"></i>
            </div>
            <h1>{{ users.length }}</h1>
            <span class="stat-sub text-up"><i class="fas fa-arrow-up"></i> 5 New today</span>
          </div>
          <div class="stat-card">
            <div class="stat-top"><span class="stat-label">Library Value</span><i class="fas fa-gem i-purple"></i></div>
            <h1>$12.4k</h1>
            <span class="stat-sub">Estimated Asset Value</span>
          </div>
          <div class="stat-card">
            <div class="stat-top"><span class="stat-label">System Health</span><i class="fas fa-server i-green"></i>
            </div>
            <h1>98%</h1>
            <span class="stat-sub">Operational</span>
          </div>
        </div>
        <div class="charts-row">
          <div class="chart-container big-chart">
            <div class="chart-header">
              <h3>Borrowing Analytics</h3>
              <button class="gold-btn" style="padding:5px 10px; font-size:11px;">Yearly</button>
            </div>
            <div style="position: relative; height: 300px; width: 100%;">
              <canvas id="mainChart"></canvas>
            </div>
          </div>
          <div class="chart-container small-chart">
            <div class="chart-header">
              <h3>Categories</h3>
            </div>
            <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center;">
              <canvas id="pieChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div v-show="currentView === 'books'" :class="['view-section', { active: currentView === 'books' }]">
        <div class="table-controls responsive-flex">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" v-model="bookSearch" placeholder="Search title, author..." />
          </div>
          <div style="display:flex; gap:10px; flex-wrap: wrap;">
            <button class="gold-btn"
              style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3);"
              @click="$refs.excelInput.click()">
              <i class="fas fa-file-excel"></i> Import
            </button>
            <input ref="excelInput" type="file" accept=".xlsx,.xls" style="display:none;" />
            <button class="gold-btn" @click="openBookModal()"><i class="fas fa-plus"></i> Add Book</button>
          </div>
        </div>
        <div class="glass-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Book Details</th>
                <th>Stock Level</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBooks" :key="b.id">
                <td><img :src="b.image" class="book-cover-sm" /></td>
                <td>
                  <div style="font-weight:600; color:var(--text-main);">{{ b.title }}</div>
                  <div style="font-size:12px; color:var(--text-muted);">{{ b.author }}</div>
                </td>
                <td><span :class="['status-badge', stockBadge(b.stock)]">{{ stockLabel(b.stock) }} ({{ b.stock
                    }})</span></td>
                <td>
                  <div style="display:flex; flex-wrap:wrap;">
                    <span v-for="cat in (b.category || 'General').split(',')" :key="cat" class="status-badge st-default"
                      style="margin:2px;">{{ cat.trim() }}</span>
                  </div>
                </td>
                <td>
                  <div class="action-row">
                    <button class="icon-btn" @click="openEditModal(b.id)"><i class="fas fa-pen"></i></button>
                    <button class="icon-btn btn-del" @click="deleteBook(b.id)"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="currentView === 'users'" :class="['view-section', { active: currentView === 'users' }]">
        <div class="table-controls responsive-flex">
          <div class="search-wrap"><i class="fas fa-search"></i><input type="text" placeholder="Search users..." />
          </div>
          <button class="gold-btn" @click="openUserModal()"><i class="fas fa-plus"></i> Add User</button>
        </div>
        <div class="glass-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.email">
                <td>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div
                      style="width:30px; height:30px; background:var(--input-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                      <i class="fas fa-user"></i></div>
                    <div>
                      <div style="font-weight:600; color:var(--text-main);">{{ u.name || 'User' }}</div>
                      <div style="font-size:11px; color:var(--text-muted);">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span
                    :style="`color:${u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)'}; font-weight:bold; text-transform:uppercase; font-size:11px;`">{{
                      u.role || 'User' }}</span></td>
                <td style="color:var(--text-muted)">-</td>
                <td><span class="status-badge st-active">Active</span></td>
                <td>
                  <div class="action-row">
                    <button class="icon-btn" @click="openEditUserModal(u.email)"><i class="fas fa-pen"></i></button>
                    <button class="icon-btn btn-del" @click="deleteUser(u.email)"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="currentView === 'approvals'" :class="['view-section', { active: currentView === 'approvals' }]">
        <div class="table-controls responsive-flex" style="justify-content:flex-start;">
          <div
            style="display:flex; align-items:center; gap:10px; background:var(--input-bg); padding:10px 15px; border-radius:12px; border:1px solid var(--border);">
            <input type="checkbox" class="checkbox-custom" v-model="selectAll" @change="toggleSelectAll" />
            <span style="font-size:13px; color:var(--text-muted); font-weight:500;">Select All</span>
          </div>
          <div style="font-style:italic; font-size:12px; color:var(--text-muted); align-self:center;">Pending actions
            only.</div>
        </div>
        <div class="glass-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>User</th>
                <th>Book</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pendingTasks.length === 0">
                <td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No pending approvals.
                </td>
              </tr>
              <tr v-for="r in pendingTasks" :key="r.id">
                <td><input type="checkbox" class="checkbox-custom" :value="r.id" v-model="selectedRequestIds" /></td>
                <td>
                  <div style="font-weight:600; color:var(--text-main);">{{ r.user_email }}</div>
                </td>
                <td style="color:var(--text-main);">{{ r.book_title }}</td>
                <td>
                  <span v-if="r.status === 'pending'" class="status-badge st-pending"><i class="fas fa-book"></i>
                    Borrow</span>
                  <span v-else class="status-badge st-returned"><i class="fas fa-undo"></i> Return</span>
                </td>
                <td>
                  <div style="font-size:12px; color:var(--text-muted);">
                    <div>
                      {{ formatRealDate(r.start_date) }} 
                      <i class="fas fa-arrow-right" style="font-size:10px; margin:0 5px;"></i> 
                      {{ formatRealDate(r.end_date) }}
                    </div>
                    
                    <div style="color:var(--accent); font-weight:600; margin-top:4px;">
                      <i class="far fa-calendar-alt"></i> {{ getRealtimeDuration(r.start_date, r.end_date, r.status) }}
                    </div>
                  </div>
                </td>
                <td style="display:flex; gap:8px; align-items:center;">
                  <button v-if="r.status === 'pending'" class="gold-btn"
                    style="padding:6px 12px; font-size:11px; background:#10b981; color:white;"
                    @click="triggerApprove(r.id, r.start_date, r.end_date)">Approve</button>
                  <button v-else class="gold-btn"
                    style="padding:6px 12px; font-size:11px; background:#3b82f6; color:white;"
                    @click="triggerReturn(r.id)">Confirm</button>
                  <button class="icon-btn btn-del" @click="triggerReject(r.id)"><i class="fas fa-times"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="currentView === 'requests'" :class="['view-section', { active: currentView === 'requests' }]">
        <div class="table-controls responsive-flex">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" v-model="reqSearch" placeholder="Search user/book..." />
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <button v-if="selectedReqIds.length > 0" class="gold-btn" @click="bulkDeleteRequests" style="background:#ef4444; color:white; border:none; padding:12px; min-width:auto;">
              <i class="fas fa-trash"></i> Delete Selected ({{ selectedReqIds.length }})
            </button>

            <button class="gold-btn" @click="reqFilter = 'pending'" style="padding:12px; min-width:auto;">Pending</button>
            <button class="gold-btn" @click="reqFilter = 'all'" style="background:var(--input-bg); color:var(--text-main); padding:12px; min-width:auto; border:1px solid var(--border);">All</button>
          </div>
        </div>
        <div class="glass-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" class="checkbox-custom" v-model="selectAllReqs" @change="toggleSelectAllReqs" /></th>
                <th>User</th>
                <th>Book Title</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedRequests.length === 0">
                <td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No requests found.</td>
              </tr>
              <tr v-for="r in paginatedRequests" :key="r.id">
                <td><input type="checkbox" class="checkbox-custom" :value="r.id" v-model="selectedReqIds" /></td>
                
                <td>
                  <div style="font-weight:600; font-size:13px; color:var(--text-main);">{{ r.user_email }}</div>
                </td>
                <td>
                  <div style="font-weight:600; color:var(--accent);">{{ r.book_title }}</div>
                </td>
                <td>
                  <div style="font-size:12px; color:var(--text-muted);">
                    <div>
                      {{ r.start_date?.split(' ')[0]?.split('T')[0] }} 
                      <i class="fas fa-arrow-right" style="font-size:10px; margin:0 5px;"></i> 
                      {{ r.end_date?.split(' ')[0]?.split('T')[0] }}
                    </div>
                    
                    <div style="color:var(--accent); font-weight:600; margin-top:4px;">
                      <i class="far fa-calendar-alt"></i> {{ getRealtimeDuration(r.start_date, r.end_date, r.status) }}
                    </div>
                  </div>
                </td>
                <td><span :class="['status-badge', reqBadge(r.status)]">{{ r.status }}</span></td>
                <td>
                  <div class="action-row">
                    <button class="icon-btn" @click="openRequestModal(r.id)"><i class="fas fa-tasks"></i></button>
                    <button class="icon-btn btn-del" @click="deleteRequest(r.id)"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination-wrapper">
          <span class="page-info">Page {{ reqPage }} of {{ totalReqPages }}</span>
          <div style="display:flex; gap:10px;">
            <button class="page-btn" :disabled="reqPage === 1" @click="reqPage--"><i
                class="fas fa-chevron-left"></i></button>
            <button class="page-btn" :disabled="reqPage === totalReqPages" @click="reqPage++"><i
                class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>

      <div v-show="currentView === 'activity'" :class="['view-section', { active: currentView === 'activity' }]">
        <div class="table-controls responsive-flex">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" v-model="actSearch" placeholder="Search email..." />
          </div>
          <button class="gold-btn" @click="fetchData"><i class="fas fa-sync-alt"></i> Refresh Logs</button>
        </div>
        <div class="glass-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Login Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(group, email) in activityGroups" :key="email">
                <td>
                  <strong style="color:var(--text-main);">{{ group.latestLog.email }}</strong>
                  <span v-if="group.count > 1"
                    style="font-size:10px; background:var(--input-bg); padding:2px 6px; border-radius:10px; margin-left:8px; color:var(--text-muted); border:1px solid var(--border);">{{
                    group.count }} logs</span>
                </td>
                <td style="text-transform:uppercase; font-size:11px; color:var(--text-muted);">{{ group.latestLog.role
                  }}</td>
                <td>
                  <div style="color:var(--text-main); font-weight:600;">
                    {{ formatRealDate(group.latestLog.login_time) }}
                  </div>
                  <div style="font-size:11px; color:var(--accent); font-weight:600; margin-top:2px;">
                    <i class="far fa-clock"></i> {{ formatRealTime(group.latestLog.login_time) }}
                  </div>
                </td>
                <td>
                  <span v-if="group.priorityStatus === 'active'" style="color:#10b981; font-weight:bold;">Online ({{ durationStr(group.latestLog, group.priorityStatus) }})</span>
                  <span v-else style="color:var(--text-muted);">{{ durationStr(group.latestLog, group.priorityStatus) }}</span>
                </td>
                <td>
                  <span v-if="group.priorityStatus === 'active'" class="status-badge st-approved">Online</span>
                  <span v-else-if="group.priorityStatus === 'kicked'" class="status-badge st-rejected">Kicked</span>
                  <span v-else class="status-badge st-default">Offline</span>
                </td>
                <td style="display:flex; align-items:center; gap:5px;">
                  <button v-if="group.priorityStatus === 'active'" class="icon-btn"
                    style="background:rgba(239,68,68,0.15); color:#ef4444;" @click="forceSignOut(group.targetId)"><i
                      class="fas fa-power-off"></i></button>
                  <button v-if="group.priorityStatus === 'kicked'" class="icon-btn"
                    style="background:rgba(245,158,11,0.15); color:#f59e0b;" @click="unkickUser(group.targetId)"><i
                      class="fas fa-undo"></i></button>
                  <button class="icon-btn btn-del" @click="deleteActivity(group.targetId)"><i
                      class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <div :class="['modal-overlay', { hidden: !showBookModal }]">
      <div class="modal-glass">
        <div class="modal-header">
          <h2>{{ bookModalTitle }}</h2>
          <div class="close-btn" @click="showBookModal = false"><i class="fas fa-times"></i></div>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="input-group"><label>Book Title</label><input type="text" v-model="bookForm.title"
                placeholder="e.g. Atomic Habits" /></div>
            <div class="input-group"><label>Author Name</label><input type="text" v-model="bookForm.author"
                placeholder="e.g. James Clear" /></div>
          </div>
          <div class="input-group">
            <label>Categories (Click to select multiple)</label>
            <div class="cat-grid">
              <div v-for="cat in categories" :key="cat"
                :class="['cat-btn', { active: bookForm.selectedCats.includes(cat) }]" @click="toggleCat(cat)">{{ cat }}
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group"><label>Stock Qty</label><input type="number" v-model="bookForm.stock" min="0"
                placeholder="0" /></div>
            <div class="input-group"><label>Book PDF (Optional)</label><input type="file" accept="application/pdf"
                id="inp-pdf" /></div>
          </div>
          <div class="input-group">
            <label>Description</label>
            <textarea v-model="bookForm.description" rows="3" placeholder="Enter book summary..."
              style="width:100%; padding:10px; border-radius:8px;"></textarea>
          </div>
          <div class="input-group"><label>Cover Image URL</label><input type="text" v-model="bookForm.image"
              placeholder="https://..." /></div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showBookModal = false">Cancel</button>
          <button class="save-btn" @click="saveBook">Save Changes</button>
        </div>
      </div>
    </div>

    <div :class="['modal-overlay', { hidden: !showUserModal }]">
      <div class="modal-glass" style="width:500px;">
        <div class="modal-header">
          <h2>{{ userModalTitle }}</h2>
          <div class="close-btn" @click="showUserModal = false"><i class="fas fa-times"></i></div>
        </div>
        <div class="modal-body">
          <div class="input-group"><label>Full Name</label><input type="text" v-model="userForm.name"
              placeholder="John Doe" /></div>
          <div class="input-group"><label>Email Address</label><input type="email" v-model="userForm.email"
              placeholder="john@example.com" /></div>
          <div class="form-row">
            <div class="input-group">
              <label>Role</label>
              <select v-model="userForm.role">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="input-group"><label>Password</label><input type="password" v-model="userForm.password"
                :placeholder="userForm.originalEmail ? 'Leave empty to keep current' : 'Required for new users'" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showUserModal = false">Cancel</button>
          <button class="save-btn" @click="saveUser">Save User</button>
        </div>
      </div>
    </div>

    <div :class="['modal-overlay', { hidden: !showRequestModal }]">
      <div class="modal-glass" style="width:500px;">
        <div class="modal-header">
          <h2>Manage Request</h2>
          <div class="close-btn" @click="showRequestModal = false"><i class="fas fa-times"></i></div>
        </div>
        <div class="modal-body">
          <div class="input-group"><label>User Email (Read-Only)</label><input type="text" v-model="requestForm.email"
              readonly style="opacity:0.6; cursor:not-allowed;" /></div>
          <div class="input-group"><label>Book Title (Read-Only)</label><input type="text" v-model="requestForm.book"
              readonly style="opacity:0.6; cursor:not-allowed;" /></div>
          <div class="form-row">
            <div class="input-group"><label>Start Date</label><input type="date" v-model="requestForm.start" /></div>
            <div class="input-group"><label>Return Date</label><input type="date" v-model="requestForm.end" /></div>
          </div>
          <div class="input-group">
            <label>Approval Status</label>
            <select v-model="requestForm.status">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showRequestModal = false">Cancel</button>
          <button class="save-btn" @click="saveRequest">Update Status</button>
        </div>
      </div>
    </div>

    <div :class="['modal-overlay', { hidden: !showQuickModal }]" @click.self="showQuickModal = false">
      <div class="quick-modal-content" v-if="quickModalData">
        <div class="q-close-corner" @click="showQuickModal = false"><i class="fas fa-times"></i></div>
        <div class="q-icon-circle"><i class="fas fa-book-reader"></i></div>
        <h2 class="q-title">{{ quickModalData.status === 'return_pending' ? 'Confirm Return' : 'Review Request' }}</h2>
        <p class="q-desc">
          User <strong>{{ quickModalData.user_email }}</strong> requests:
          <span>{{ quickModalData.book_title }}</span>
          <span style="font-size:12px; color:var(--text-muted); display:block;">{{ quickModalData.start_date }} to {{
            quickModalData.end_date }}</span>
        </p>
        <div class="q-actions">
          <button class="btn-q-reject" @click="processQuickAction('rejected')">Reject</button>
          <button class="btn-q-approve" @click="processQuickAction('approved')"><i class="fas fa-check"></i> {{
            quickModalData.status === 'return_pending' ? 'Confirm Return' : 'Approve' }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, booksApi, requestsApi, usersApi, authApi } from '../composables/useApi.js'

const router = useRouter()

// ===========================
// STATE
// ===========================
const isLoading = ref(false)
const toastVisible = ref(false)
const toastMsg = ref('')
const currentView = ref('overview')
const currentDateStr = ref(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

// Theme State
const isLightMode = ref(false)
const isSidebarOpen = ref(false)

// Data
const books = ref([])
const users = ref([])
const requests = ref([])
const activities = ref([])
const pendingNotifications = ref([])

// UI State
const showNotifDropdown = ref(false)
const showBookModal = ref(false)
const showUserModal = ref(false)
const showRequestModal = ref(false)
const showQuickModal = ref(false)
const quickModalData = ref(null)
const showConfirm = ref(false)

// Search/Filter
const bookSearch = ref('')
const reqSearch = ref('')
const actSearch = ref('')
const reqFilter = ref('all')
const reqPage = ref(1)
const reqPageSize = 10

// Selections
const selectedRequestIds = ref([])
const selectAll = ref(false)

// Confirm
let confirmResolver = null
const confirmData = ref({ title: '', desc: '', btnText: 'Confirm', type: 'warn', icon: '', btnStyle: '' })

// Book Modal
const bookModalTitle = ref('Add New Book')
const bookForm = ref({ id: null, title: '', author: '', category: '', image: '', stock: 5, description: '', selectedCats: [] })
const categories = ['Leadership', 'Culture', 'Philosophy', 'Economic', 'IT', 'General', 'History']

// User Modal
const userModalTitle = ref('Add New User')
const userForm = ref({ name: '', email: '', role: 'user', password: '', originalEmail: '' })

// Request Modal
const requestForm = ref({ id: null, email: '', book: '', start: '', end: '', status: 'pending' })

// Charts
let mainChartInstance = null
let pieChartInstance = null

// Heartbeat/polling
let heartbeatInterval = null
let notifInterval = null

let timeInterval = null
const currentTime = ref(new Date().getTime())

const selectedReqIds = ref([])
const selectAllReqs = ref(false)

// ===========================
// COMPUTED
// ===========================
const navItems = [
  { view: 'overview', label: 'Overview', icon: 'fas fa-th-large' },
  { view: 'books', label: 'Inventory', icon: 'fas fa-book' },
  { view: 'users', label: 'Users & Roles', icon: 'fas fa-users ic-user-admin' },
  { view: 'approvals', label: 'Approvals', icon: 'fas fa-check-double' },
  { view: 'requests', label: 'Borrow Requests', icon: 'fas fa-hand-holding-heart' },
  { view: 'activity', label: 'Activity Logs', icon: 'fas fa-history' },
]

const pageHeading = computed(() => {
  const map = { overview: 'Dashboard Overview', books: 'Inventory', users: 'Users & Roles', approvals: 'Approvals', requests: 'Borrow Requests', activity: 'Activity Logs' }
  return map[currentView.value] || 'Dashboard'
})

const filteredBooks = computed(() => {
  const q = bookSearch.value.toLowerCase()
  return books.value.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
})

const pendingTasks = computed(() =>
  requests.value.filter(r => r.status === 'pending' || r.status === 'return_pending')
)

const filteredRequests = computed(() => {
  const q = reqSearch.value.toLowerCase()
  let data = [...requests.value].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return b.id - a.id
  })
  if (reqFilter.value !== 'all') data = data.filter(r => r.status === reqFilter.value)
  if (q) data = data.filter(r => r.user_email?.toLowerCase().includes(q) || r.book_title?.toLowerCase().includes(q))
  return data
})

const totalReqPages = computed(() => Math.max(1, Math.ceil(filteredRequests.value.length / reqPageSize)))

const paginatedRequests = computed(() => {
  const start = (reqPage.value - 1) * reqPageSize
  return filteredRequests.value.slice(start, start + reqPageSize)
})

const activityGroups = computed(() => {
  const q = actSearch.value.toLowerCase()
  const userMap = {}
  const sorted = [...activities.value].sort((a, b) => b.id - a.id)
  
  sorted.forEach(act => {
    if (q && !act.email.toLowerCase().includes(q)) return

    let currentStatus = act.status
    // គន្លឹះសំខាន់៖ ទម្លាក់ទៅជា Offline ដោយស្វ័យប្រវត្តិ បើអសកម្មលើសពី ៩០ វិនាទី
    if (currentStatus === 'active' && act.last_active) {
       const lastActiveTime = getLocalTime(act.last_active).getTime()
       if (currentTime.value - lastActiveTime > 90000) { 
         currentStatus = 'offline' 
       }
    }

    if (!userMap[act.email]) {
      userMap[act.email] = { latestLog: act, count: 1, priorityStatus: currentStatus, targetId: act.id }
    } else {
      userMap[act.email].count++
      if (currentStatus === 'active') { 
         userMap[act.email].priorityStatus = 'active'
         userMap[act.email].targetId = act.id 
      }
      else if (userMap[act.email].priorityStatus !== 'active' && currentStatus === 'kicked') { 
         userMap[act.email].priorityStatus = 'kicked'
         userMap[act.email].targetId = act.id 
      }
    }
  })
  return userMap
})

// ===========================
// METHODS
// ===========================
function switchView(view) {
  currentView.value = view
  isSidebarOpen.value = false // close sidebar on mobile after navigation

  if (view === 'overview') {
    nextTick(initCharts) // Re-render charts when returning to overview
  }
}

function toggleTheme() {
  isLightMode.value = !isLightMode.value
  localStorage.setItem('theme', isLightMode.value ? 'light' : 'dark')
  if (isLightMode.value) document.body.classList.add('light-mode')
  else document.body.classList.remove('light-mode')

  if (currentView.value === 'overview') {
    nextTick(initCharts) // Re-render charts to pick up theme changes
  }
}

function showToast(message) {
  toastMsg.value = message
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

function stockBadge(stock) {
  if (stock === 0) return 'st-stock-out'
  if (stock <= 3) return 'st-stock-low'
  return 'st-stock-ok'
}
function stockLabel(stock) {
  if (stock === 0) return 'Out of Stock'
  if (stock <= 3) return 'Low Stock'
  return 'Available'
}
function reqBadge(status) {
  return { pending: 'st-pending', approved: 'st-approved', rejected: 'st-rejected', returned: 'st-returned' }[status] || 'st-pending'
}

// ១. អនុគមន៍អានម៉ោងធម្មតា (ដកការបូកថែម ៧ ម៉ោង ឬ Timezone ចេញ)
function getLocalTime(dateStr) {
  if (!dateStr) return new Date()
  let d = new Date(dateStr)
  
  // ការពារ Error ពេល Browser ខ្លះមិនស្គាល់ទម្រង់ថ្ងៃខែ
  if (isNaN(d.getTime()) && typeof dateStr === 'string') {
    d = new Date(dateStr.replace(/-/g, '/').replace('T', ' ').split('.')[0])
  }
  
  // លែងមានកូដបូក ៧ ម៉ោងទៀតហើយ គឺយកម៉ោងដើមសុទ្ធសាធ
  return d
}

// ២. ទាញយក ថ្ងៃខែឆ្នាំ
function formatRealDate(dateStr) {
  if (!dateStr) return '-'
  return getLocalTime(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ៣. ទាញយក ម៉ោង
function formatRealTime(dateStr) {
  if (!dateStr) return '-'
  return getLocalTime(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ៤. គណនារយៈពេល (ប្រើម៉ោងដើម)
function durationStr(act, status) {
  // បើកំពុង Online លោត Just now
  if (status === 'active') return 'Just now'
  
  // បើ Offline យកម៉ោងចុងក្រោយមកដកជាមួយម៉ោងបច្ចុប្បន្ន
  const targetStr = act.logout_time || act.last_active || act.login_time
  if (!targetStr) return '0m'
  
  const targetTime = getLocalTime(targetStr).getTime()
  const diffMins = Math.floor((currentTime.value - targetTime) / 60000)
  
  if (diffMins <= 0) return '1m' // លោតយ៉ាងហោចណាស់ 1m បើទើបបិទភ្លាមៗ
  
  const h = Math.floor(diffMins / 60)
  const m = diffMins % 60
  const d = Math.floor(h / 24)
  
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// Custom Confirm
function showCustomConfirm(title, desc, btnText, type) {
  return new Promise(resolve => {
    confirmResolver = resolve
    const icons = { danger: '<i class="fas fa-trash"></i>', success: '<i class="fas fa-check"></i>', warn: '<i class="fas fa-exclamation"></i>' }
    const btnStyles = { danger: 'background:#ef4444; color:white;', success: 'background:#10b981; color:white;', warn: 'background:var(--accent); color:black;' }
    confirmData.value = { title, desc, btnText, type, icon: icons[type] || icons.warn, btnStyle: btnStyles[type] || btnStyles.warn }
    showConfirm.value = true
  })
}
function resolveConfirm(result) {
  showConfirm.value = false
  if (confirmResolver) confirmResolver(result)
}

// Fetch
async function fetchData() {
  try {
    const data = await adminApi.getAdminData()
    if (data.success) {
      books.value = data.books || []
      users.value = data.users || []
      requests.value = data.requests || []
      activities.value = data.activities || []
    }
  } catch (e) { console.error(e) }
}

async function fetchNotifications() {
  try {
    const data = await adminApi.getAdminNotifications()
    const arr = Array.isArray(data) ? data : []
    if (arr.length > pendingNotifications.value.length && pendingNotifications.value.length > 0) {
      showToast(`New Request: ${arr[0]?.book_title}`)
    }
    pendingNotifications.value = arr
  } catch (e) { console.error(e) }
}

// Approvals - ចុចអនុម័ត 
async function triggerApprove(id, start, end) {
  const ok = await showCustomConfirm('Approve Request?', 'User will be allowed to take the book.', 'Yes, Approve', 'success')
  if (ok) { 
    isLoading.value = true // បើក Loading
    try {
      const data = await apiUpdate(id, 'approved', start, end)
      if (data.success) {
        showToast('Request Approved Successfully!')
        await fetchData()
      } else {
        showToast(data.message || 'Failed to approve', 'error')
      }
    } catch (e) {
      showToast('Connection error. Please try again.', 'error')
    } finally {
      isLoading.value = false // បិទ Loading វិញ
    }
  }
}

// ទទួលសៀវភៅត្រឡប់មកវិញ
async function triggerReturn(id) {
  const ok = await showCustomConfirm('Confirm Return?', 'This will mark the book as back in stock.', 'Confirm Return', 'warn')
  if (ok) { 
    isLoading.value = true // បើក Loading
    try {
      const data = await apiUpdate(id, 'returned')
      if (data.success) {
        showToast('Book Return Confirmed!')
        await fetchData()
      } else {
        showToast(data.message || 'Failed to return', 'error')
      }
    } catch (e) {
      showToast('Connection error', 'error')
    } finally {
      isLoading.value = false // បិទ Loading វិញ
    }
  }
}

// បដិសេធសំណើ
async function triggerReject(id) {
  const ok = await showCustomConfirm('Reject Request?', 'User will be notified.', 'Yes, Reject', 'danger')
  if (ok) { 
    isLoading.value = true // បើក Loading
    try {
      const data = await apiUpdate(id, 'rejected')
      if (data.success) {
        showToast('Request Rejected!')
        await fetchData()
      } else {
        showToast(data.message || 'Failed to reject', 'error')
      }
    } catch (e) {
      showToast('Connection error', 'error')
    } finally {
      isLoading.value = false // បិទ Loading វិញ
    }
  }
}
async function apiUpdate(id, status, start = '', end = '') {
  return await requestsApi.updateRequest({ id, status, start_date: start, end_date: end })
}

// Bulk
function toggleSelectAll() {
  if (selectAll.value) selectedRequestIds.value = pendingTasks.value.map(r => r.id)
  else selectedRequestIds.value = []
}
// Bulk Actions
async function bulkApprove() {
  const count = selectedRequestIds.value.length
  if (!count) return
  const ok = await showCustomConfirm(`Approve ${count} Requests?`, 'These users will be allowed to borrow books.', 'Yes, Approve All', 'success')
  if (ok) {
    isLoading.value = true // បើក Loading
    try {
      for (const id of selectedRequestIds.value) {
        const r = requests.value.find(req => req.id === id)
        if (r) {
          if (r.status === 'pending') await apiUpdate(id, 'approved', r.start_date, r.end_date)
          else if (r.status === 'return_pending') await apiUpdate(id, 'returned')
        }
      }
      showToast(`${count} requests approved!`)
      selectedRequestIds.value = []; selectAll.value = false
      await fetchData()
    } catch (e) {
      showToast('Error processing some requests.', 'error')
    } finally {
      isLoading.value = false // បិទ Loading វិញ
    }
  }
}

async function bulkReject() {
  const count = selectedRequestIds.value.length
  if (!count) return
  const ok = await showCustomConfirm(`Reject ${count} Requests?`, 'This cannot be undone.', 'Reject All', 'danger')
  if (ok) {
    isLoading.value = true // បើក Loading
    try {
      for (const id of selectedRequestIds.value) await apiUpdate(id, 'rejected')
      showToast(`${count} requests rejected.`)
      selectedRequestIds.value = []; selectAll.value = false
      await fetchData()
    } catch (e) {
      showToast('Error processing some requests.', 'error')
    } finally {
      isLoading.value = false // បិទ Loading វិញ
    }
  }
}

// Notifications quick modal
function openQuickModal(index) {
  quickModalData.value = pendingNotifications.value[index]
  showQuickModal.value = true
  showNotifDropdown.value = false
}
// Notifications quick modal
async function processQuickAction(status) {
  if (!quickModalData.value) return
  let finalStatus = status
  if (quickModalData.value.status === 'return_pending' && status === 'approved') finalStatus = 'returned'
  
  isLoading.value = true // បើក Loading
  try {
    const data = await requestsApi.updateRequest({ id: quickModalData.value.id, status: finalStatus, start_date: quickModalData.value.start_date, end_date: quickModalData.value.end_date })
    if (data.success) {
      showQuickModal.value = false
      await fetchNotifications()
      await fetchData()
      showToast(`Request ${finalStatus === 'returned' ? 'Return Confirmed' : finalStatus}!`)
    } else {
      showToast(data.message || 'Failed to process request', 'error')
    }
  } catch (e) { 
    showToast('Connection error', 'error')
  } finally {
    isLoading.value = false // បិទ Loading វិញ
  }
}

// Books CRUD
function openBookModal() {
  bookModalTitle.value = 'Add New Book'
  bookForm.value = { id: null, title: '', author: '', image: '', stock: 5, description: '', selectedCats: [] }
  showBookModal.value = true
}
function openEditModal(id) {
  const b = books.value.find(b => b.id === id)
  if (!b) return
  bookModalTitle.value = 'Edit Book'
  const cats = (b.category || '').split(', ').map(c => c.trim()).filter(Boolean)
  bookForm.value = { id: b.id, title: b.title, author: b.author, image: b.image, stock: b.stock || 0, description: b.description || '', selectedCats: cats }
  showBookModal.value = true
}
function toggleCat(cat) {
  const idx = bookForm.value.selectedCats.indexOf(cat)
  if (idx > -1) bookForm.value.selectedCats.splice(idx, 1)
  else bookForm.value.selectedCats.push(cat)
}
async function saveBook() {
  if (!bookForm.value.selectedCats.length) return alert('Please select at least one category')
  const payload = { id: bookForm.value.id || null, title: bookForm.value.title, author: bookForm.value.author, category: bookForm.value.selectedCats.join(', '), image: bookForm.value.image, stock: bookForm.value.stock, description: bookForm.value.description }
  try {
    const data = await booksApi.saveBook(payload)
    if (data.success) { showBookModal.value = false; await fetchData(); showToast('Saved Successfully') }
    else alert('Error: ' + data.message)
  } catch (e) { alert('Server Error') }
}
async function deleteBook(id) {
  if (!confirm('Delete this book permanently?')) return
  await booksApi.deleteBook(id)
  await fetchData()
}

// Users CRUD
function openUserModal() {
  userModalTitle.value = 'Add New User'
  userForm.value = { name: '', email: '', role: 'user', password: '', originalEmail: '' }
  showUserModal.value = true
}
function openEditUserModal(email) {
  const u = users.value.find(u => u.email === email)
  if (!u) return
  userModalTitle.value = 'Edit User'
  userForm.value = { name: u.name || '', email: u.email, role: u.role || 'user', password: '', originalEmail: u.email }
  showUserModal.value = true
}
async function saveUser() {
  if (!userForm.value.name || !userForm.value.email) return alert('Name and Email are required')
  if (!userForm.value.originalEmail && !userForm.value.password) return alert('Password is required for new users')
  try {
    const data = await usersApi.saveUser({ name: userForm.value.name, email: userForm.value.email, role: userForm.value.role, password: userForm.value.password, original_email: userForm.value.originalEmail })
    if (data.success) { showUserModal.value = false; await fetchData(); alert(data.message || 'User saved') }
    else alert('Error: ' + data.message)
  } catch (e) { alert('Server Error') }
}
async function deleteUser(email) {
  if (!confirm(`Delete user ${email}?`)) return
  try {
    const data = await usersApi.deleteUser(email)
    if (data.success) await fetchData()
    else alert('Failed to delete user')
  } catch (e) { console.error(e) }
}

// Requests
function openRequestModal(id) {
  const req = requests.value.find(r => r.id === id)
  if (!req) return
  requestForm.value = { id: req.id, email: req.user_email, book: req.book_title, start: req.start_date, end: req.end_date, status: req.status }
  showRequestModal.value = true
}
async function saveRequest() {
  try {
    const data = await requestsApi.updateRequest({ id: requestForm.value.id, status: requestForm.value.status, start_date: requestForm.value.start, end_date: requestForm.value.end })
    if (data.success) { showRequestModal.value = false; await fetchData(); await fetchNotifications(); alert('Request updated successfully') }
    else alert(data.message)
  } catch (e) { alert('Server Error') }
}
// មុខងារ Select All សម្រាប់ Borrow Requests
function toggleSelectAllReqs() {
  if (selectAllReqs.value) {
    selectedReqIds.value = paginatedRequests.value.map(r => r.id)
  } else {
    selectedReqIds.value = []
  }
}

// មុខងារលុបសំណើតែមួយ (Single Delete)
async function deleteRequest(id) {
  const ok = await showCustomConfirm('Delete Request?', 'Are you sure you want to delete this record?', 'Yes, Delete', 'danger')
  if (!ok) return
  
  isLoading.value = true
  try {
    const data = await requestsApi.deleteRequest(id)
    if (data.success) {
      // លោត Alert ជោគជ័យ
      showToast('Borrow request deleted successfully!', 'success')
      await fetchData()
      await fetchNotifications()
    } else {
      showToast(data.message || 'Could not delete.', 'error')
    }
  } catch (e) {
    showToast('Connection error', 'error')
  } finally {
    isLoading.value = false
  }
}

// មុខងារលុបសំណើច្រើនក្នុងពេលតែមួយ (Bulk Delete)
async function bulkDeleteRequests() {
  const count = selectedReqIds.value.length
  if (!count) return
  
  const ok = await showCustomConfirm(`Delete ${count} Requests?`, 'This action cannot be undone.', 'Delete All', 'danger')
  if (!ok) return
  
  isLoading.value = true
  try {
    for (const id of selectedReqIds.value) {
      await requestsApi.deleteRequest(id)
    }
    // លោត Alert ជោគជ័យបញ្ជាក់ចំនួនដែលបានលុប
    showToast(`${count} borrow requests deleted successfully!`, 'success')
    
    selectedReqIds.value = []
    selectAllReqs.value = false
    await fetchData()
    await fetchNotifications()
  } catch (e) {
    showToast('Error processing deletion.', 'error')
  } finally {
    isLoading.value = false
  }
}

// Activity
async function forceSignOut(id) {
  if (!confirm('Force sign out this user?')) return
  const data = await adminApi.forceLogout(id)
  if (data.success) { await fetchData(); showToast('User signed out successfully') }
}
async function unkickUser(id) {
  if (!confirm("Restore this user's session (Unkick)?")) return
  const data = await adminApi.unkickUser(id)
  if (data.success) { await fetchData(); showToast('User unkicked. Session restored.') }
  else alert(data.message)
}
// មុខងារលុប Activity Log
async function deleteActivity(id) {
  const ok = await showCustomConfirm('Delete Log?', 'Are you sure you want to delete this activity log?', 'Yes, Delete', 'danger')
  if (!ok) return
  
  isLoading.value = true 
  try {
    const data = await adminApi.deleteActivity(id)
    if (data.success) {
      // លោត Alert ជោគជ័យ
      showToast('Activity log deleted successfully!', 'success')
      await fetchData() 
    } else {
      showToast(data.message || 'Failed to delete activity log', 'error')
    }
  } catch (e) {
    showToast('Connection error. Please try again.', 'error')
  } finally {
    isLoading.value = false 
  }
}

// Charts
function initCharts() {
  if (currentView.value !== 'overview') return;

  const ctx1 = document.getElementById('mainChart')?.getContext('2d')
  const ctx2 = document.getElementById('pieChart')?.getContext('2d')
  if (!ctx1 || !ctx2) return

  // Theme colors for charts
  const gridColor = isLightMode.value ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255,255,255,0.05)'
  const textColor = isLightMode.value ? '#64748b' : '#94a3b8'

  if (mainChartInstance) mainChartInstance.destroy()
  mainChartInstance = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'Books Borrowed', data: [12, 19, 3, 5, 2, 30], borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: gridColor }, ticks: { color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  })

  const catCount = {}
  books.value.forEach(b => { catCount[b.category] = (catCount[b.category] || 0) + 1 })
  if (pieChartInstance) pieChartInstance.destroy()
  pieChartInstance = new Chart(ctx2, {
    type: 'doughnut',
    data: { labels: Object.keys(catCount), datasets: [{ data: Object.values(catCount), backgroundColor: ['#D4AF37', '#3b82f6', '#ef4444', '#10b981', '#a855f7'], borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: textColor } } }
    }
  })
}

async function logout() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!confirm('Log out?')) return
  if (u) await authApi.logout(u.email, sessionStorage.getItem('session_id'))
  sessionStorage.removeItem('currentUser')
  sessionStorage.removeItem('session_id')
  router.push('/')
}

async function sendPulse() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  const sid = sessionStorage.getItem('session_id')
  if (!u) return
  try { await authApi.heartbeat(u.email, sid, 'admin') } catch (e) { }
}

// អនុគមន៍សម្រាប់គណនារយៈពេលសល់ជាក់ស្តែង (បង្ហាញចំនួនថ្ងៃសល់ និង ថ្ងៃហួសកំណត់)
function getRealtimeDuration(startDate, endDate, status) {
  if (status === 'returned') return 'បានសងរួច'
  if (status === 'rejected') return 'បានបដិសេធ'

  const end = new Date(endDate).getTime()
  const start = new Date(startDate).getTime()
  const now = currentTime.value

  // បើមិនទាន់ដល់ថ្ងៃចាប់ផ្តើម
  if (now < start) return 'មិនទាន់ដល់ថ្ងៃ'

  const diff = end - now

  // ករណីហួសកំណត់ (diff ក្រោម ០)
  if (diff < 0) {
    // គណនាចំនួនថ្ងៃដែលហួស
    const overdueDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24))
    if (overdueDays > 0) {
      return `ហួសកំណត់ ${overdueDays} ថ្ងៃ`
    }
    return `ហួសកំណត់ថ្ងៃនេះ` // ករណីហួសម៉ោង តែស្ថិតក្នុងថ្ងៃដដែល
  }

  // ករណីមិនទាន់ហួសកំណត់ (សល់ថ្ងៃ)
  const remainingDays = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (remainingDays > 0) {
    return `សល់ ${remainingDays} ថ្ងៃ`
  }
  
  return `ថ្ងៃនេះជាថ្ងៃចុងក្រោយ`
}

// ===========================
// LIFECYCLE
// ===========================
onMounted(async () => {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u || u.role !== 'admin') { alert('Restricted Access'); router.push('/dashboard'); return }

  // Check Theme
  isLightMode.value = localStorage.getItem('theme') === 'light'
  if (isLightMode.value) document.body.classList.add('light-mode')

  isLoading.value = true
  await fetchData()
  await fetchNotifications()
  isLoading.value = false

  // Init charts after data loaded
  setTimeout(initCharts, 100)

  notifInterval = setInterval(fetchNotifications, 5000)
  heartbeatInterval = setInterval(sendPulse, 30000)
  timeInterval = setInterval(() => {
    currentTime.value = new Date().getTime()
  }, 60000)
  sendPulse()

  // Click outside to close dropdown
  document.addEventListener('click', (e) => {
    const profile = document.querySelector('.admin-profile')
    if (profile && !profile.contains(e.target)) showNotifDropdown.value = false
  })
})

onUnmounted(() => {
  clearInterval(notifInterval)
  clearInterval(heartbeatInterval)
  if (mainChartInstance) mainChartInstance.destroy()
  if (pieChartInstance) pieChartInstance.destroy()
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style>
@import url('../assets/css/admin.css');
</style>

<style scoped>
/* ==========================================================
   Responsive Overrides for Full-Page Web App
   ========================================================== */
.mobile-menu-btn {
  display: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-main);
  transition: color 0.2s;
}

.mobile-close-btn {
  display: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--text-muted);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.sidebar-backdrop.show {
  opacity: 1;
  pointer-events: auto;
}

.responsive-flex {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.search-wrap {
  flex: 1;
  min-width: 250px;
}

/* Ensure horizontal scrolling for tables on small screens */
.glass-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 1024px) {
  .charts-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {

  /* Turn sidebar into off-canvas mobile menu */
  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    width: 260px;
    height: 100vh;
    z-index: 1001;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
  }

  .sidebar.open {
    left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-close-btn {
    display: block;
    margin-left: auto;
  }

  .desktop-only {
    display: none !important;
  }

  /* Adjust main content */
  .main-content {
    padding: 20px 15px;
  }

  .top-bar {
    margin-bottom: 25px;
  }

  .header-text h2 {
    font-size: 22px;
  }

  /* Stack stats */
  .stats-grid {
    grid-template-columns: 1fr;
  }

  /* Stack modals */
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>