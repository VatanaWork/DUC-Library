<template>
  <div class="app-frame" :class="{ 'light-mode': isLightMode, 'is-sub-page': isSubPage }">
    <div :class="['logout-modal-overlay', { hidden: !showLogoutModal }]" @click.self="showLogoutModal = false">
      <div class="logout-modal-box">
        <div class="logout-icon-circle">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <h3 class="logout-title">{{ t('logout_title', 'ចាកចេញពីគណនី?') }}</h3>
        <p class="logout-desc">{{ t('logout_desc', 'តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ? អ្នកនឹងត្រូវ Login ចូលម្តងទៀតនៅពេលក្រោយ។') }}</p>
        
        <div class="logout-actions">
          <button class="logout-btn-cancel" @click="showLogoutModal = false">{{ t('btn_cancel', 'បោះបង់') }}</button>
          <button class="logout-btn-confirm" @click="confirmLogout">{{ t('btn_confirm_logout', 'ចាកចេញ') }}</button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="global-loader">
      <div class="global-spinner"></div>
    </div>

    <div id="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['modern-toast', toast.type]">
        <i :class="['fas', toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle', 'toast-icon']"></i>
        <div class="toast-msg">{{ toast.message }}</div>
      </div>
    </div>

    <div id="sticky-search-header" :class="{ visible: showStickySearch }">
      <div class="search-bar" style="width:100%; border:none; background:var(--bg-search);">
        <i class="fas fa-search"></i>
        <input type="text" v-model="stickySearch" @input="syncSearch" :placeholder="t('search_placeholder','Search library...')" />
      </div>
    </div>

    <header v-if="!isSubPage" class="header">
      <div class="header-title">
        <h3 id="page-title">{{ currentPageTitle }}</h3>
      </div>
      <div class="header-actions">
        <div class="notif-box" @click="openNotificationPage">
          <i class="far fa-bell"></i>
          <div class="notif-badge" v-if="unreadCount > 0">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </div>
        </div>
        <div class="user-avatar" @click="switchView('profile')"></div>
      </div>
    </header>

    <div v-show="currentView === 'home'" class="view-section" :class="{ active: currentView === 'home' }">
      <div class="search-area">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" v-model="homeSearch" @input="filterBooks" :placeholder="t('search_placeholder','Search library...')" />
        </div>
      </div>

      <div class="carousel-wrapper">
        <div class="carousel-container" ref="carouselRef">
          <div v-for="(book, i) in allBooks.slice(0,3)" :key="book.id" class="carousel-slide" @click="openDetail(book.id)">
            <div class="slide-bg" :style="`background-image: url('${book.image}')`"></div>
            <div class="slide-overlay">
              <span class="slide-tag">Featured</span>
              <h3 class="slide-title">{{ book.title }}</h3>
              <p class="slide-sub">{{ book.author }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="h-list-wrapper">
        <div class="section-header" style="padding-bottom:10px;">
          <h2>{{ t('trending_header','Trending Now') }}</h2>
        </div>
        <div class="h-scroll-container">
          <div v-for="book in allBooks.slice(0,4)" :key="book.id" class="h-book-card" @click="openDetail(book.id)">
            <img :src="book.image" class="h-book-img" />
            <div class="h-book-title">{{ book.title }}</div>
            <div class="h-book-auth">{{ book.author }}</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2>{{ t('arrivals_header','New Arrivals') }}</h2>
      </div>

      <div class="category-scroll">
        <div
          v-for="cat in homeCategories" :key="cat.val"
          :class="['chip', { active: activeCategory === cat.val }]"
          @click="setHomeCategory(cat.val)"
        >{{ t(cat.key, cat.label) }}</div>
      </div>

      <div class="list-container">
        <div v-for="book in filteredHomeBooks.slice(0,4)" :key="book.id" class="book-row" @click="openDetail(book.id)">
          <div style="position:relative;">
            <img :src="book.image" class="row-img" />
          </div>
          <div class="row-info">
            <div class="row-header">
              <div class="row-title">{{ book.title }}</div>
            </div>
            <div class="row-author">by {{ book.author }}</div>
            <div class="row-meta-badge">
              <span class="category-badge">{{ book.category }}</span>
              <div class="rating-badge"><i class="fas fa-star" style="font-size:9px;"></i> {{ book.rating }}</div>
            </div>
          </div>
          <div class="row-actions">
            <div :class="['fav-btn', { active: savedIds.includes(book.id) }]"
              @click.stop="toggleSave(book.id, null)">
              <i :class="savedIds.includes(book.id) ? 'fas fa-heart' : 'far fa-heart'"></i>
            </div>
          </div>
        </div>
        
        <div class="full-width-btn-wrap">
          <button v-if="allBooks.length > 4" class="see-more-btn" @click="switchView('books')">
            <span>View Full Collection</span><i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <div class="author-section">
        <div class="section-header" style="margin-top:30px;">
          <h2>{{ t('authors_header','Top Authors') }}</h2>
          <span style="font-size:12px; color:var(--accent); cursor:pointer;">{{ t('authors_view_all','View All') }}</span>
        </div>
        <div class="author-scroll">
          <div class="author-item" v-for="a in topAuthors" :key="a.name">
            <img :src="a.img" class="author-img" />
            <span class="author-name">{{ a.name }}</span>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2>{{ t('curated_header','Curated For You') }}</h2>
      </div>
      <div class="collections-grid">
        <div class="collection-card" style="background: url('https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400') center/cover;">
          <div class="col-overlay"><span class="col-text">Best of 2024</span></div>
        </div>
        <div class="collection-card" style="background: url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400') center/cover;">
          <div class="col-overlay"><span class="col-text">Editors Choice</span></div>
        </div>
      </div>

      <div class="section-header" style="margin-top:10px;">
        <h2>{{ t('insights_header','Library Insights') }}</h2>
      </div>
      <div class="stats-highlight-wrapper">
        <div class="stats-scroll responsive-stats-grid">
          <div class="stat-pill">
            <i class="fas fa-book-open stat-pill-icon"></i>
            <span class="stat-pill-num">{{ allBooks.length || '12.4k' }}</span>
            <span class="stat-pill-label">{{ t('stat_books','Total Books') }}</span>
          </div>
          <div class="stat-pill">
            <i class="fas fa-users stat-pill-icon"></i>
            <span class="stat-pill-num">842</span>
            <span class="stat-pill-label">{{ t('stat_readers','Active Readers') }}</span>
          </div>
          <div class="stat-pill">
            <i class="fas fa-feather-alt stat-pill-icon"></i>
            <span class="stat-pill-num">150+</span>
            <span class="stat-pill-label">{{ t('stat_authors','New Authors') }}</span>
          </div>
        </div>
      </div>

      <div class="quote-section">
        <div class="quote-card">
          <div class="quote-icon-bg">“</div>
          <p class="quote-text">{{ t('quote_text', '"A reader lives a thousand lives before he dies."') }}</p>
          <div class="quote-divider"></div>
          <span class="quote-author">Mr. KHEM PHEARUN</span>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'books'" class="view-section" :class="{ active: currentView === 'books' }">
      <div class="lib-view-header">
        <div class="lib-controls">
          <div class="search-bar" style="flex:1;">
            <i class="fas fa-search"></i>
            <input type="text" v-model="libSearch" @input="applyLibraryFilters" :placeholder="t('lib_search_placeholder','Find a book...')" />
          </div>
        </div>
        <div class="category-scroll" id="lib-chips">
          <div v-for="cat in libCategories" :key="cat.val"
            :class="['chip', { active: activeLibCategory === cat.val }]"
            @click="filterLibrary(cat.val)">
            {{ t(cat.key, cat.label) }}
          </div>
        </div>
      </div>
      <div class="library-grid">
        <div v-for="book in filteredLibBooks" :key="book.id" class="pro-book-card" @click="openDetail(book.id)">
          <div class="pro-cover-area">
            <img :src="book.image" class="pro-book-cover" />
            <div :class="['card-status-glass', stockClass(book.stock)]">
              <div class="status-dot"></div>{{ stockText(book.stock) }}
            </div>
            <button :class="['card-fav-btn', { active: savedIds.includes(book.id) }]"
              @click.stop="toggleSave(book.id, null)">
              <i :class="savedIds.includes(book.id) ? 'fas fa-heart' : 'far fa-heart'"></i>
            </button>
          </div>
          <div class="pro-book-info">
            <div class="pro-book-title">{{ book.title }}</div>
            <div class="pro-book-author">{{ book.author }}</div>
            <div class="star-row">
              <i v-for="n in 5" :key="n" :class="['fas fa-star star-icon', { filled: n <= Math.round(book.rating) }]"
                @click.stop="rateBook(book.id, n)"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'borrowed'" class="view-section" :class="{ active: currentView === 'borrowed' }">
      <div class="list-container">
        <div v-if="borrowedBooks.length === 0" style="text-align:center; padding:40px 20px; grid-column: 1 / -1;">
          <i class="fas fa-book-reader" style="font-size:40px; color:var(--border); margin-bottom:20px;"></i>
          <h3 style="color:var(--text-gray); font-weight:400;">{{ t('shelf_empty','No active loans') }}</h3>
          <p style="color:#555; font-size:13px; margin-top:10px;">{{ t('shelf_empty_sub','Approved requests appear here.') }}</p>
        </div>
        <div v-for="book in borrowedBooks" :key="book.id" class="borrowed-card" @click="openDetail(book.id)">
          <img :src="book.image" class="borrowed-img" />
          <div class="borrowed-info">
            <div>
              <div class="b-title">{{ book.title }}</div>
              <div class="b-author">by {{ book.author }}</div>
              <div class="progress-label">
                <span>{{ t('lbl_due','Due') }}: {{ book.dueDate }}</span>
                <span>{{ t('lbl_reading','Reading...') }}</span>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:40%"></div></div>
            </div>
            <button class="return-action-btn" @click.stop="returnFromShelf($event, book.id)">
              <i class="fas fa-undo"></i> {{ t('btn_return_action','Return') }}
            </button>
          </div>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'favourite'" class="view-section" :class="{ active: currentView === 'favourite' }">
      <div class="list-container">
        <p v-if="savedBooks.length === 0" style="text-align:center; color:gray; margin-top:40px; grid-column: 1 / -1;">
          {{ t('fav_empty','No favourites yet') }}
        </p>
        <div v-for="book in savedBooks" :key="book.id" class="book-row" @click="openDetail(book.id)">
          <img :src="book.image" class="row-img" />
          <div class="row-info">
            <div class="row-title">{{ book.title }}</div>
            <div class="row-author">{{ book.author }}</div>
          </div>
          <div class="row-actions">
            <div class="fav-btn active" @click.stop="toggleSave(book.id, null)">
              <i class="fas fa-heart"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'profile'" class="view-section" :class="{ active: currentView === 'profile' }">
      <div class="pro-header">
        <div class="pro-cover"></div>
        <div class="pro-header-content">
          <div class="pro-avatar-container">
            <div class="profile-img-lg"></div>
            <div class="edit-badge" @click="showEditForm = !showEditForm">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <h2 class="pro-name">{{ currentUser?.name || 'User' }}</h2>
          <p class="pro-email">{{ currentUser?.email || '' }}</p>
        </div>
      </div>

      <div class="card-perspective" :class="{ flipped: cardFlipped }" @click="cardFlipped = !cardFlipped">
        <div class="card-inner">
          <div class="gold-member-card">
            <div class="card-top">
              <span class="card-label">Cinematic Library</span>
              <i class="fas fa-wifi card-chip"></i>
            </div>
            <div class="card-mid">
              <div class="card-chip-sim"></div>
              <span class="card-number">{{ cardNumber }}</span>
            </div>
            <div class="card-bottom">
              <div class="card-info"><span class="label">HOLDER</span><span class="val">{{ currentUser?.name }}</span></div>
              <div class="card-info"><span class="label">TAP TO FLIP</span><span class="val"><i class="fas fa-sync-alt"></i></span></div>
            </div>
            <div class="card-shine"></div>
          </div>
          <div class="card-back modern-access-pass">
            <div class="pass-header">
              <span class="pass-label">OFFICIAL MEMBER</span>
              <i class="fas fa-crown pass-icon"></i>
            </div>
            
            <div class="qr-container">
              <div class="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LibraryMember" alt="QR" class="qr-img" />
              </div>
              <div class="qr-scan-line"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showEditForm" class="edit-form-container">
        <h3 class="group-title">Edit Profile</h3>
        <div class="setting-group">
          <input type="text" v-model="editForm.name" placeholder="Full Name" class="clean-input" />
          <input type="text" v-model="editForm.phone" placeholder="Phone Number" class="clean-input" />
          <textarea v-model="editForm.bio" placeholder="Short bio..." class="clean-input" rows="2"></textarea>
          <button class="save-pro-btn" @click="saveProfilePro">{{ t('pro_save_btn','Save Updates') }}</button>
        </div>
      </div>

      <div class="settings-grid">
        <div class="settings-wrapper">
          <h3 class="group-title">{{ t('grp_pref','Preferences') }}</h3>
          <div class="setting-group">
            <div class="setting-row">
              <div class="set-icon bg-blue"><i class="fas fa-moon"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_dark_mode','Dark Mode') }}</span>
                <label class="switch">
                  <input type="checkbox" v-model="isLightMode" :true-value="false" :false-value="true" @change="toggleTheme" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <h3 class="group-title">{{ t('grp_account','Account') }}</h3>
          <div class="setting-group">
            <div class="setting-row is-link" @click="switchView('security')">
              <div class="set-icon bg-orange"><i class="fas fa-lock"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_security','Security & Password') }}</span>
                <i class="fas fa-chevron-right arrow"></i>
              </div>
            </div>
            <div class="setting-row is-link" @click="loadReadingHistory">
              <div class="set-icon bg-purple"><i class="fas fa-history"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_history','Reading History') }}</span>
                <i class="fas fa-chevron-right arrow"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-wrapper">
          <h3 class="group-title">{{ t('grp_personal','Personalization') }}</h3>
          <div class="setting-group">
            <div class="setting-row is-link" @click="switchView('reading-goal')">
              <div class="set-icon" style="background:#8b5cf6;"><i class="fas fa-bullseye"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_goal','Reading Goal') }}</span>
                <i class="fas fa-chevron-right arrow"></i>
              </div>
            </div>
            <div class="setting-row is-link" @click="switchView('notifications-settings')">
              <div class="set-icon" style="background:#f59e0b;"><i class="fas fa-bell"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_notif','Notifications') }}</span>
                <i class="fas fa-chevron-right arrow"></i>
              </div>
            </div>
            <div class="setting-row is-link" @click="switchView('language')">
              <div class="set-icon" style="background:#0ea5e9;"><i class="fas fa-globe"></i></div>
              <div class="set-content">
                <span>{{ t('lbl_lang','Language') }}</span>
                <i class="fas fa-chevron-right arrow"></i>
              </div>
            </div>
          </div>

          <h3 class="group-title">{{ t('grp_comm','Community') }}</h3>
          <div class="setting-group">
            <div class="setting-row is-link" @click="switchView('community-suggest')">
              <div class="set-icon" style="background:#ec4899;"><i class="fas fa-gift"></i></div>
              <div class="set-content"><span>{{ t('lbl_suggest','Suggest a Purchase') }}</span><i class="fas fa-chevron-right arrow"></i></div>
            </div>
            <div class="setting-row is-link" @click="switchView('community-donate')">
              <div class="set-icon" style="background:#10b981;"><i class="fas fa-hand-holding-heart"></i></div>
              <div class="set-content"><span>{{ t('lbl_donate','Donate a Book') }}</span><i class="fas fa-chevron-right arrow"></i></div>
            </div>
            <div class="setting-row is-link" @click="switchView('community-report')">
              <div class="set-icon" style="background:#ef4444;"><i class="fas fa-bug"></i></div>
              <div class="set-content"><span>{{ t('lbl_report','Report a Problem') }}</span><i class="fas fa-chevron-right arrow"></i></div>
            </div>
            <div class="setting-row is-link" @click="switchView('contact-us')">
              <div class="set-icon" style="background:#64748b;"><i class="fas fa-envelope-open-text"></i></div>
              <div class="set-content"><span>{{ t('lbl_contact','Contact Us') }}</span><i class="fas fa-chevron-right arrow"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-wrapper" style="margin-top: 20px;">
        <button class="logout-btn-pro" @click="logout">{{ t('btn_logout','Log Out') }}</button>
        <p class="version-text">{{ t('lbl_version','Version 1.0.0 • Created by Vatana') }}</p>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'security'" class="view-section" :class="{ active: currentView === 'security' }">
      <SubPageHeader :title="t('sec_header','Security')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#3b82f6; border-color:#3b82f6;"><i class="fas fa-shield-alt"></i></div>
        <h2>{{ t('sec_hero_title','Account Protection') }}</h2>
        <p>{{ t('sec_hero_desc','Manage your password and login sessions.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <form @submit.prevent="submitChangePassword">
          <div class="modern-card">
            <h3 class="group-title" style="margin-left:0; color:var(--text-white);">{{ t('sec_upd_pass_title','Update Password') }}</h3>
            <div style="margin-bottom:15px;">
              <label style="font-size:10px; color:var(--accent); font-weight:700;">{{ t('sec_curr_pass','CURRENT PASSWORD') }}</label>
              <input type="password" v-model="passForm.old" required class="clean-input border-input" :placeholder="t('sec_pass_ph','••••••••')" />
            </div>
            <div style="margin-bottom:10px;">
              <label style="font-size:10px; color:var(--accent); font-weight:700;">{{ t('sec_new_pass','NEW PASSWORD') }}</label>
              <input type="password" v-model="passForm.new" required class="clean-input border-input" :placeholder="t('sec_new_pass_ph','Min. 8 characters')" @input="checkPassStrength(passForm.new)" />
            </div>
            <div class="strength-bar-bg">
              <div :class="['strength-segment', passStrength >= 1 ? 'active' : '', passStrength === 1 ? 'weak' : passStrength === 2 ? 'med' : passStrength === 3 ? 'strong' : '']"></div>
              <div :class="['strength-segment', passStrength >= 2 ? 'active' : '', passStrength === 2 ? 'med' : passStrength === 3 ? 'strong' : '']"></div>
              <div :class="['strength-segment', passStrength >= 3 ? 'active strong' : '']"></div>
            </div>
            <div style="text-align:right; font-size:10px; color:var(--text-gray); margin-top:5px;">{{ passStrengthMsg }}</div>
            <div style="margin-bottom:25px;">
              <label style="font-size:10px; color:var(--accent); font-weight:700;">{{ t('sec_conf_pass','CONFIRM PASSWORD') }}</label>
              <input type="password" v-model="passForm.confirm" required class="clean-input border-input" :placeholder="t('sec_pass_ph','••••••••')" />
            </div>
            <button type="submit" class="save-pro-btn primary-solid-btn">
              {{ t('sec_btn_update','Update Security') }}
            </button>
          </div>
        </form>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'reading-goal'" class="view-section" :class="{ active: currentView === 'reading-goal' }">
      <SubPageHeader :title="t('goal_header','Reading Challenge')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon"><i class="fas fa-trophy"></i></div>
        <h2>{{ t('goal_hero_title','2026 Challenge') }}</h2>
        <p>{{ t('goal_hero_desc','Push your limits. Consistent reading expands your mind.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="modern-card">
          <div class="goal-visual" :style="`background: conic-gradient(var(--accent) ${goalDeg}deg, rgba(255,255,255,0.05) ${goalDeg}deg);`">
            <div class="goal-inner">
              <span class="goal-number">{{ goalValue }}</span>
              <span class="goal-label">{{ t('goal_lbl_books','Books') }}</span>
            </div>
          </div>
          <div style="text-align:center; margin-bottom:20px;">
            <p style="color:var(--text-gray); font-size:12px;">{{ t('goal_adjust_txt','Adjust your yearly target') }}</p>
          </div>
          <form @submit.prevent="saveGoal">
            <div class="range-container">
              <input type="range" min="1" max="100" v-model="goalValue" class="styled-range" @input="goalValue = +$event.target.value" />
            </div>
            <div style="display:flex; justify-content:space-between; color:var(--text-gray); font-size:10px; margin-top:5px; margin-bottom:25px;">
              <span>{{ t('goal_min_lbl','1 Book') }}</span><span>{{ t('goal_max_lbl','100 Books') }}</span>
            </div>
            <button type="submit" class="save-pro-btn" style="border-radius:12px;">{{ t('goal_btn_update','Update My Goal') }}</button>
          </form>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'language'" class="view-section" :class="{ active: currentView === 'language' }">
      <SubPageHeader :title="t('lang_header','Language')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#8b5cf6; border-color:#8b5cf6;"><i class="fas fa-globe"></i></div>
        <h2>{{ t('lang_hero_title','Display Language') }}</h2>
        <p>{{ t('lang_hero_desc','Choose your preferred interface language.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div :class="['modern-card lang-card', { active: currentLang === 'en' }]" @click="setLanguageHandler('en')">
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />
            <div>
              <div style="font-weight:600; font-size:15px; color:var(--text-white);">{{ t('lang_opt_en','English') }}</div>
              <div style="font-size:11px; color:var(--text-gray);">{{ t('lang_sub_en','Default') }}</div>
            </div>
          </div>
          <i class="fas fa-check-circle lang-check"></i>
        </div>
        <div :class="['modern-card lang-card', { active: currentLang === 'kh' }]" @click="setLanguageHandler('kh')">
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Flag_of_Cambodia.svg" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />
            <div>
              <div style="font-weight:600; font-size:15px; color:var(--text-white);">{{ t('lang_opt_kh','Khmer') }}</div>
              <div style="font-size:11px; color:var(--text-gray);">{{ t('lang_sub_kh','Cambodia') }}</div>
            </div>
          </div>
          <i class="fas fa-check-circle lang-check"></i>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'notifications-settings'" class="view-section" :class="{ active: currentView === 'notifications-settings' }">
      <SubPageHeader :title="t('nset_header','Notifications')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#f59e0b; border-color:#f59e0b;"><i class="fas fa-bell"></i></div>
        <h2>{{ t('nset_hero_title','Stay Updated') }}</h2>
        <p>{{ t('nset_hero_desc','Control the alerts you receive.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <form @submit.prevent="saveNotif">
          <div class="modern-card">
            <h3 class="group-title" style="margin-left:0; color:var(--accent);">{{ t('nset_grp_activity','Library Activity') }}</h3>
            <div class="notif-row-detail">
              <div class="n-text"><h4>{{ t('nset_due_title','Due Date Reminders') }}</h4><p>{{ t('nset_due_desc','Get notified 2 days before your book is due.') }}</p></div>
              <label class="switch"><input type="checkbox" v-model="notifSettings.dueDate" /><span class="slider"></span></label>
            </div>
            <div class="notif-row-detail">
              <div class="n-text"><h4>{{ t('nset_req_title','Request Status') }}</h4><p>{{ t('nset_req_desc','Instant alerts when admin approves your books.') }}</p></div>
              <label class="switch"><input type="checkbox" v-model="notifSettings.requestStatus" /><span class="slider"></span></label>
            </div>
          </div>
          <div class="modern-card">
            <h3 class="group-title" style="margin-left:0; color:var(--accent);">{{ t('nset_grp_disc','Discovery') }}</h3>
            <div class="notif-row-detail">
              <div class="n-text"><h4>{{ t('nset_new_title','New Arrivals') }}</h4><p>{{ t('nset_new_desc','Weekly summary of new books added to shelf.') }}</p></div>
              <label class="switch"><input type="checkbox" v-model="notifSettings.newArrivals" /><span class="slider"></span></label>
            </div>
            <div class="notif-row-detail">
              <div class="n-text"><h4>{{ t('nset_rec_title','Recommendations') }}</h4><p>{{ t('nset_rec_desc','Books based on your reading history.') }}</p></div>
              <label class="switch"><input type="checkbox" v-model="notifSettings.recommendations" /><span class="slider"></span></label>
            </div>
          </div>
          <button type="submit" class="save-pro-btn" style="border-radius:12px;">{{ t('nset_btn_save','Save Preferences') }}</button>
        </form>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'community-suggest'" class="view-section" :class="{ active: currentView === 'community-suggest' }">
      <SubPageHeader :title="t('sug_header','Suggest')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#ec4899; border-color:#ec4899;"><i class="fas fa-gift"></i></div>
        <h2>{{ t('sug_hero_title','Make a Wish') }}</h2>
        <p>{{ t('sug_hero_desc','Tell us what books you want to see here.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="modern-card">
          <form @submit.prevent="submitSuggestion">
            <h3 class="group-title" style="margin-left:0; color:#ec4899;">{{ t('sug_grp_details','Book Details') }}</h3>
            <div style="margin-bottom:15px;"><input type="text" v-model="sugForm.title" required class="clean-input border-input" :placeholder="t('sug_ph_title','Book Title')" /></div>
            <div style="margin-bottom:15px;"><input type="text" v-model="sugForm.author" required class="clean-input border-input" :placeholder="t('sug_ph_author','Author Name')" /></div>
            <div style="margin-bottom:20px;"><textarea v-model="sugForm.reason" class="clean-input border-input" rows="3" :placeholder="t('sug_ph_reason','Why should we add this?')" style="resize:none;"></textarea></div>
            <button type="submit" class="save-pro-btn" style="border-radius:12px;">{{ t('sug_btn_submit','Submit Request') }}</button>
          </form>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'community-donate'" class="view-section" :class="{ active: currentView === 'community-donate' }">
      <SubPageHeader :title="t('don_header','Donate')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#10b981; border-color:#10b981;"><i class="fas fa-hand-holding-heart"></i></div>
        <h2>{{ t('don_hero_title','Give Back') }}</h2>
        <p>{{ t('don_hero_desc','Rehome your books to our community.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="modern-card">
          <form @submit.prevent="submitDonate">
            <div style="margin-bottom:15px;"><input type="text" v-model="donForm.title" required class="clean-input border-input" :placeholder="t('don_ph_title','Book Title')" /></div>
            <h3 class="group-title" style="margin-left:0; margin-top:10px;">{{ t('don_grp_condition','Condition') }}</h3>
            <div class="selection-grid">
              <div v-for="cond in conditions" :key="cond.val" :class="['select-card', { active: donForm.condition === cond.val }]" @click="donForm.condition = cond.val">
                <i :class="cond.icon"></i><span>{{ t(cond.key, cond.label) }}</span>
              </div>
            </div>
            <h3 class="group-title" style="margin-left:0; margin-top:10px;">{{ t('don_grp_date','Drop-off Date') }}</h3>
            <div style="margin-bottom:20px;"><input type="date" v-model="donForm.date" required class="date-input" /></div>
            <button type="submit" class="save-pro-btn" style="border-radius:12px; background:#10b981; color:white;">{{ t('don_btn_confirm','Confirm Donation') }}</button>
          </form>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'community-report'" class="view-section" :class="{ active: currentView === 'community-report' }">
      <SubPageHeader :title="t('rep_header','Support')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#ef4444; border-color:#ef4444;"><i class="fas fa-headset"></i></div>
        <h2>{{ t('rep_hero_title','Need Help?') }}</h2>
        <p>{{ t('rep_hero_desc','Let us know if something isn\'t right.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="modern-card">
          <form @submit.prevent="submitReport">
            <h3 class="group-title" style="margin-left:0;">{{ t('rep_grp_type','Issue Type') }}</h3>
            <div class="selection-grid">
              <div v-for="type in reportTypes" :key="type.val" :class="['select-card', type.colorClass, { active: repForm.type === type.val }]" @click="repForm.type = type.val">
                <i :class="type.icon"></i><span>{{ t(type.key, type.label) }}</span>
              </div>
            </div>
            <div style="margin-bottom:20px;"><textarea v-model="repForm.desc" required class="clean-input border-input" rows="5" :placeholder="t('rep_ph_desc','Describe the problem...')" style="resize:none;"></textarea></div>
            <button type="submit" class="save-pro-btn" style="border-radius:12px; border:1px solid #ef4444; background:transparent; color:#ef4444;">{{ t('rep_btn_submit','Submit Report') }}</button>
          </form>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'contact-us'" class="view-section" :class="{ active: currentView === 'contact-us' }">
      <SubPageHeader :title="t('cont_header','Contact Us')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#64748b; border-color:#64748b;"><i class="fas fa-paper-plane"></i></div>
        <h2>{{ t('cont_hero_title','Get in Touch') }}</h2>
        <p>{{ t('cont_hero_desc','Have questions? We\'d love to hear from you.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="modern-card-all">
          <div class="modern-card is-link contact-modern" @click="window.location.href='tel:+855715831867'">
            <i class="fas fa-phone-alt"></i>
            <div class="contact-modern-tittle-under">{{ t('cont_card_phone','Phone') }}</div>
          </div>
          <div class="modern-card is-link contact-modern" @click="window.location.href='mailto:digitaluniversityofcambodia@gmail.com'">
            <i class="fas fa-envelope"></i>
            <div class="contact-modern-tittle-under">{{ t('cont_card_email','Email') }}</div>
          </div>
          <div class="modern-card is-link contact-modern" @click="openMap">
            <i class="fas fa-map-marked-alt"></i>
            <div class="contact-modern-tittle-under">{{ t('cont_card_locate','Locate Us') }}</div>
          </div>
        </div>
        <div class="modern-card">
          <form @submit.prevent="submitContactForm">
            <h3 class="group-title" style="margin-left:0; color:var(--accent);">{{ t('cont_grp_inquiry','Direct Inquiry') }}</h3>
            <div style="margin-bottom:15px;"><input type="text" v-model="contactForm.subject" required class="clean-input border-input" :placeholder="t('cont_ph_subject','Subject')" /></div>
            <div style="margin-bottom:20px;"><textarea v-model="contactForm.message" required class="clean-input border-input" rows="4" :placeholder="t('cont_ph_msg','Your message...')"></textarea></div>
            <button type="submit" class="save-pro-btn" style="background:var(--accent); color:#000; border-radius:20px;">{{ t('cont_btn_submit','Submit Message') }}</button>
          </form>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <div v-show="currentView === 'notifications'" class="view-section" :class="{ active: currentView === 'notifications' }">
      <SubPageHeader :title="t('nl_header','Notifications')" @back="switchView('profile')" />
      
      <div class="settings-wrapper form-centered-wrapper notification-padding">
        
        <div v-if="notifications.length === 0" class="empty-state-clean">
          <div class="empty-icon-circle"><i class="far fa-bell-slash"></i></div>
          <h3>All Caught Up</h3>
          <p>{{ t('nl_empty','You have no new notifications right now.') }}</p>
        </div>

        <div class="notif-list-clean" style="overflow-x: hidden;">
          <div v-for="item in notifications" :key="item.id" 
               :id="'notif-' + item.id"
               :class="['clean-card', { unread: !item.read }]" 
               @click="markAsRead(item.id)" 
               @touchstart="onTouchStart"
               @touchend="onTouchEnd($event, item.id)"
               style="cursor: pointer; transition: transform 0.3s ease, opacity 0.3s ease;">
               
            <div :class="['clean-icon', item.type]">
              <i :class="['fas', item.type === 'success' ? 'fa-check' : item.type === 'error' ? 'fa-exclamation' : 'fa-info']"></i>
            </div>
            
            <div class="clean-content">
              <div class="c-title">{{ item.title }}</div>
              <div class="c-msg">{{ item.message }}</div>
              <div class="c-time">{{ formatNotifDate(item.time) }}</div>
            </div>
            <div v-if="!item.read" class="unread-dot"></div>
          </div>
        </div>

      </div>
    </div>

    <div v-show="currentView === 'reading-history'" class="view-section" :class="{ active: currentView === 'reading-history' }">
      <SubPageHeader :title="t('hist_header','History')" @back="switchView('profile')" />
      <div class="setting-hero">
        <div class="setting-hero-icon" style="color:#8b5cf6; border-color:#8b5cf6;"><i class="fas fa-history"></i></div>
        <h2>{{ t('hist_hero_title','Your Journey') }}</h2>
        <p>{{ t('hist_hero_desc','A timeline of the worlds you\'ve visited.') }}</p>
      </div>
      <div class="settings-wrapper form-centered-wrapper">
        <div class="history-timeline">
          <div v-for="(book, i) in allBooks.slice(0,5)" :key="book.id" class="history-item">
            <div class="history-dot"></div>
            <div class="history-date">{{ historyDates[i] }}</div>
            <div class="history-card" @click="openDetail(book.id)">
              <img :src="book.image" class="h-img-mini" />
              <div>
                <div style="font-weight:600; font-size:14px; color:var(--text-white); margin-bottom:4px;">{{ book.title }}</div>
                <div style="font-size:11px; color:var(--text-gray);">{{ t('hist_stat_comp','Completed') }} • {{ t('hist_stat_rated','Rated') }} 5 <i class="fas fa-star" style="color:#fbbf24"></i></div>
                <div style="font-size:10px; color:var(--accent); margin-top:6px; font-weight:600;">{{ t('hist_btn_read','READ AGAIN') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </div>

    <nav class="nav-bar" v-if="!isSubPage">
      <div v-for="nav in navItems" :key="nav.view" :class="['nav-icon', { active: currentView === nav.view }]" @click="switchView(nav.view)">
        <i :class="nav.icon"></i>
        <span class="nav-label-desktop">{{ nav.label }}</span>
      </div>
    </nav>

    <div :class="['detail-overlay', { hidden: !showDetail }]">
      <div class="detail-backdrop" @click="closeDetail"></div>
      <div class="detail-content">
        <div class="detail-close-btn" @click="closeDetail"><i class="fas fa-times"></i></div>
        
        <div class="detail-desktop-split" v-if="selectedBook">
          <div class="detail-cover-wrapper">
            <img :src="selectedBook.image" class="bg-blur" />
            <img :src="selectedBook.image" class="main-cover" />
          </div>

          <div class="detail-scroll-area">
            <div class="detail-head-info">
              <span class="d-chip">{{ selectedBook.category }}</span>
              <h1 id="detail-title">{{ selectedBook.title }}</h1>
              <p id="detail-author">by {{ selectedBook.author }}</p>
              <div class="d-rating-row">
                <i class="fas fa-star filled"></i>
                <span>{{ selectedBook.rating }}</span>
                <span class="d-dot">•</span>
                <span>2h 45m Read</span>
              </div>
            </div>
            
            <div class="detail-actions">
              <button :class="['action-btn primary-btn', borrowBtnClass]" @click="handleBorrowAction" :disabled="borrowBtnDisabled">
                <i :class="borrowBtnIcon"></i> {{ borrowBtnText }}
              </button>
              <button v-if="selectedBook.pdf" class="btn-read-online" @click="openPdf">
                <i class="fas fa-book-open"></i> <span class="read-text">{{ t('btn_read','Read') }}</span>
              </button>
              <button class="action-btn icon-only" @click="toggleSaveFromDetail">
                <i :class="savedIds.includes(selectedBook.id) ? 'fas fa-heart' : 'far fa-heart'"></i>
              </button>
            </div>
            
            <div class="detail-section">
              <h3>{{ t('lbl_synopsis','Synopsis') }}</h3>
              <p class="d-desc">{{ selectedBook.description || t('desc_default','Immerse yourself in this captivating journey.') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div :class="['detail-overlay center-modal-overlay', { hidden: !showBorrowModal }]" style="z-index:2100;">
      <div class="detail-backdrop" @click="showBorrowModal = false"></div>
      <div class="borrow-form-card">
        <h3>Request to Borrow</h3>
        <p class="sub-text">Select your preferred dates. An admin must approve this request.</p>
        <form @submit.prevent="submitBorrowRequest">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" v-model="borrowForm.start" required class="date-input" />
          </div>
          <div class="form-group">
            <label>Return Date</label>
            <input type="date" v-model="borrowForm.end" required class="date-input" />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showBorrowModal = false">Cancel</button>
            <button type="submit" class="confirm-btn">Submit Request</button>
          </div>
        </form>
      </div>
    </div>

    <div :class="['detail-overlay center-modal-overlay', { hidden: !showReturnModal }]" style="z-index:2200;">
      <div class="detail-backdrop" @click="showReturnModal = false"></div>
      <div class="borrow-form-card" style="text-align:center;">
        <div style="width:70px; height:70px; background:rgba(59,130,246,0.15); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto; font-size:28px;">
          <i class="fas fa-undo-alt"></i>
        </div>
        <h3 style="font-size:22px; margin-bottom:10px;">Return Book?</h3>
        <p class="sub-text" style="font-size:14px; line-height:1.5; margin-bottom:25px; color:var(--text-gray);">
          You are about to return this book. <br>This action will notify the admin.
        </p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showReturnModal = false">Cancel</button>
          <button class="confirm-btn" @click="submitReturn" style="background:#3b82f6; color:white;">Confirm Return</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const showLogoutModal = ref(false)
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import SubPageHeader from '../components/SubPageHeader.vue'
import { booksApi, requestsApi, usersApi, authApi } from '../composables/useApi.js'
import { useTranslation } from '../composables/useTranslation.js'

const router = useRouter()
const { t, currentLang, loadTranslations, setLanguage } = useTranslation()

// ===========================
// STATE
// ===========================
const isLoading = ref(false)
const toasts = ref([])
const currentView = ref('home')
const isLightMode = ref(localStorage.getItem('theme') === 'dark')

const currentUser = ref(JSON.parse(sessionStorage.getItem('currentUser')))
const cardNumber = ref('')
const cardFlipped = ref(false)

// Books
const allBooks = ref([])
const savedIds = ref(JSON.parse(localStorage.getItem('favBooks')) || [])
const userRatings = ref(JSON.parse(localStorage.getItem('userRatings')) || {})
const activeCategory = ref('All')
const activeLibCategory = ref('All')
const homeSearch = ref('')
const libSearch = ref('')
const stickySearch = ref('')
const showStickySearch = ref(false)

// Requests / Notifications
const myRequests = ref([])
const notifications = ref([])
const unreadCount = ref(0)
const pendingReturnId = ref(null)

// Detail
const showDetail = ref(false)
const selectedBook = ref(null)
const showBorrowModal = ref(false)
const showReturnModal = ref(false)
const borrowForm = ref({ start: '', end: '' })

// Profile
const showEditForm = ref(false)
const editForm = ref({ name: '', phone: '', bio: '' })

// Password
const passForm = ref({ old: '', new: '', confirm: '' })
const passStrength = ref(0)
const passStrengthMsg = ref('Strength: Empty')

// Goal
const goalValue = ref(parseInt(localStorage.getItem('userReadingGoal') || '12'))
const goalDeg = computed(() => (goalValue.value / 100) * 360)

// Forms
const notifSettings = ref({ dueDate: true, requestStatus: true, newArrivals: false, recommendations: true })
const sugForm = ref({ title: '', author: '', reason: '' })
const donForm = ref({ title: '', condition: 'new', date: new Date().toISOString().split('T')[0] })
const repForm = ref({ type: 'bug', desc: '' })
const contactForm = ref({ subject: '', message: '' })

// Carousel
const carouselRef = ref(null)
const carouselIndex = ref(0)
let autoScrollInterval = null
let heartbeatInterval = null
let notifInterval = null

// ===========================
// STATIC DATA
// ===========================
const homeCategories = [
  { val: 'All', key: 'cat_all', label: 'All' },
  { val: 'Leadership', key: 'cat_leader', label: 'Leadership' },
  { val: 'Culture', key: 'cat_culture', label: 'Culture' },
  { val: 'Sale & Marketing', key: 'cat_sales', label: 'Sale & Marketing' },
  { val: 'IT', key: 'cat_it', label: 'IT' },
  { val: 'Philosophy', key: 'cat_philo', label: 'Philosophy' },
  { val: 'Economic', key: 'cat_eco', label: 'Economic' },
]

const libCategories = [
  { val: 'All', key: 'cat_all', label: 'All' },
  { val: 'Leadership', key: 'cat_leader', label: 'Leadership' },
  { val: 'Culture', key: 'cat_culture', label: 'Culture' },
  { val: 'Philosophy', key: 'cat_philo', label: 'Philosophy' },
  { val: 'Marketing & Sale', key: 'cat_marketing', label: 'Marketing' },
  { val: 'Economic', key: 'cat_eco', label: 'Economic' },
  { val: 'IT', key: 'cat_it', label: 'IT' },
  { val: 'General', key: 'cat_general', label: 'General' },
]

const navItems = [
  { view: 'home', icon: 'fas fa-home', label: 'Discover' },
  { view: 'books', icon: 'fas fa-book-open', label: 'Library' },
  { view: 'borrowed', icon: 'fas fa-book-reader', label: 'My Shelf' },
  { view: 'favourite', icon: 'far fa-heart', label: 'Favorites' },
  { view: 'profile', icon: 'far fa-user', label: 'Profile' },
]

const topAuthors = [
  { name: 'J.K. Rowling', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { name: 'Stephen King', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { name: 'James Clear', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' },
]

const historyDates = computed(() => [
  t('hist_time_now', 'Just Now'), t('hist_time_yest', 'Yesterday'),
  t('hist_time_week', 'Last Week'), 'Dec 20, 2025', 'Nov 15, 2025'
])

const conditions = [
  { val: 'new', key: 'don_cond_new', label: 'New', icon: 'fas fa-wand-magic-sparkles' },
  { val: 'good', key: 'don_cond_good', label: 'Good', icon: 'fas fa-check' },
  { val: 'fair', key: 'don_cond_fair', label: 'Fair', icon: 'fas fa-book-open' },
]

const reportTypes = [
  { val: 'bug', key: 'rep_type_bug', label: 'Bug', icon: 'fas fa-bug', colorClass: 's-red' },
  { val: 'account', key: 'rep_type_account', label: 'Account', icon: 'fas fa-user-shield', colorClass: 's-blue' },
  { val: 'content', key: 'rep_type_content', label: 'Content', icon: 'fas fa-file-alt', colorClass: '' },
]

// ===========================
// COMPUTED
// ===========================
const isSubPage = computed(() => {
  const subs = ['security','reading-goal','notifications-settings','language','community-suggest',
    'community-donate','community-report','contact-us','notifications','reading-history']
  return subs.includes(currentView.value)
})

// អនុគមន៍បំប្លែងថ្ងៃខែសម្រាប់ Notification
function formatNotifDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  
  // ការពារ Error បើទម្រង់ខុស
  if (isNaN(d.getTime())) return dateStr; 

  // បង្ហាញចេញជាទម្រង់ ឧទាហរណ៍៖ 31 Mar 2026, 12:00 AM
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  return `${datePart}, ${timePart}`;
}

// បន្ថែមមុខងារនេះចូលទៅក្នុង <script setup> របស់អ្នក
function truncateTitle(text, maxLength) {
  if (!text) return '';
  // បើឈ្មោះសៀវភៅខ្លីជាងឬស្មើចំនួនដែលកំណត់ នោះបង្ហាញឈ្មោះពេញ
  if (text.length <= maxLength) return text; 
  // បើវែងជាង គឺកាត់យកត្រឹមចំនួនដែលកំណត់ រួចថែម ... ពីក្រោយ
  return text.substring(0, maxLength) + '...';
}

const currentPageTitle = computed(() => {
  const map = { home: 'page_discover', books: 'lib_view_header', borrowed: 'shelf_view_header', favourite: 'fav_view_header', profile: 'pro_view_header' }
  return t(map[currentView.value] || 'page_discover', 'Discover')
})

const filteredHomeBooks = computed(() => {
  const q = homeSearch.value.toLowerCase()
  return allBooks.value.filter(b => {
    const cats = (b.category || '').split(', ')
    const matchCat = activeCategory.value === 'All' || cats.includes(activeCategory.value)
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    return matchCat && matchSearch
  })
})

const filteredLibBooks = computed(() => {
  const q = libSearch.value.toLowerCase()
  return allBooks.value.filter(b => {
    const cats = (b.category || '').split(', ')
    const matchCat = activeLibCategory.value === 'All' || cats.includes(activeLibCategory.value)
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    return matchCat && matchSearch
  })
})

const borrowedBooks = computed(() => {
  const approvedIds = myRequests.value.filter(r => r.status === 'approved').map(r => r.book_id)
  return allBooks.value.filter(b => approvedIds.includes(b.id)).map(b => {
    const req = myRequests.value.find(r => r.book_id === b.id && r.status === 'approved')
    return { ...b, dueDate: req?.end_date || t('lbl_soon', 'Soon') }
  })
})

const savedBooks = computed(() => allBooks.value.filter(b => savedIds.value.includes(b.id)))

// Borrow button state
const activeReq = computed(() => {
  if (!selectedBook.value) return null
  return myRequests.value.find(r => r.book_id === selectedBook.value.id &&
    ['pending','approved','return_pending'].includes(r.status))
})

const borrowBtnText = computed(() => {
  if (!selectedBook.value) return t('btn_borrow', 'Borrow')
  if (!activeReq.value) {
    return selectedBook.value.stock <= 0 ? t('btn_out', 'Out Stock') : t('btn_borrow', 'Borrow')
  }
  const statusMap = {
    approved: t('btn_return_book','Return Book'),
    return_pending: t('btn_return_pending','Return Pending'),
    pending: t('btn_pending_app','Pending Approval'),
  }
  return statusMap[activeReq.value.status] || t('btn_borrow','Borrow')
})

const borrowBtnClass = computed(() => {
  if (!activeReq.value) return selectedBook.value?.stock <= 0 ? 'pending' : ''
  if (activeReq.value.status === 'approved') return 'borrowed'
  return 'pending'
})

const borrowBtnIcon = computed(() => {
  if (!activeReq.value) return selectedBook.value?.stock <= 0 ? 'fas fa-ban' : 'fas fa-book-reader'
  if (activeReq.value.status === 'approved') return 'fas fa-check-circle'
  return 'fas fa-clock'
})

const borrowBtnDisabled = computed(() => {
  if (!activeReq.value) return selectedBook.value?.stock <= 0
  return ['pending','return_pending'].includes(activeReq.value?.status)
})

// ===========================
// METHODS
// ===========================
function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}

function switchView(view) {
  currentView.value = view
  const frame = document.querySelector('.app-frame')
  if (frame) frame.scrollTo(0, 0)
}

// ១. ពេលចុចកណ្តឹង គ្រាន់តែបើក Tab ធម្មតា (លែងឱ្យវាលុបលេខកណ្តឹងអូតូទៀតហើយ)
function openNotificationPage() {
  switchView('notifications')
}

// ២. ទាញយកសារ និងរៀបសារថ្មីឱ្យនៅលើគេ
async function backgroundCheckNotifs() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) return
  try {
    await fetchMyRequests()
    const data = await requestsApi.myNotifications(u.email)
    if (data.force_logout) {
      alert('អ្នកត្រូវបាន Sign out ដោយ Admin។')
      sessionStorage.removeItem('currentUser')
      router.push('/')
      return
    }
    // បន្ថែមពាក្យ .reverse() ដើម្បីឱ្យសារថ្មីៗ (ចុងក្រោយគេ) ត្រូវរុញមកលើគេ
    const arr = Array.isArray(data) ? data.reverse() : [] 
    const readIds = JSON.parse(localStorage.getItem('readNotificationIds')) || []
    
    notifications.value = arr.map(n => ({ ...n, read: readIds.includes(n.id) }))
    unreadCount.value = notifications.value.filter(n => !n.read).length
  } catch (e) { console.error(e) }
}

// ៣. អនុគមន៍សម្រាប់ចុច Mark ថាបានអានរួច (Read) ម្តងមួយៗ
function markAsRead(id) {
  const notif = notifications.value.find(n => n.id === id)
  if (notif && !notif.read) {
    notif.read = true // ដកសញ្ញាចុចក្រហមចេញ
    
    // បន្ថយលេខកណ្តឹងភ្លាមៗ
    unreadCount.value = notifications.value.filter(n => !n.read).length
    
    // កត់ត្រាចូលក្នុង LocalStorage ថាបានអានរួច
    const readIds = JSON.parse(localStorage.getItem('readNotificationIds')) || []
    if (!readIds.includes(id)) {
      readIds.push(id)
      localStorage.setItem('readNotificationIds', JSON.stringify(readIds))
    }
  }
}

// ==========================================
// មុខងារ Swipe ពីស្តាំទៅឆ្វេងដើម្បីលុប Notification
// ==========================================
let touchStartX = 0
let touchStartY = 0

// ចាប់យកទីតាំងពេលចាប់ផ្តើមប៉ះ
function onTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX
  touchStartY = e.changedTouches[0].screenY
}

// គណនាពេលដកដៃចេញ ថាតើគាត់អូសទៅឆ្វេងឬអត់
function onTouchEnd(e, id) {
  const touchEndX = e.changedTouches[0].screenX
  const touchEndY = e.changedTouches[0].screenY
  
  const deltaX = touchStartX - touchEndX // គណនាចម្ងាយអូសផ្តេក
  const deltaY = Math.abs(touchStartY - touchEndY) // គណនាចម្ងាយអូសបញ្ឈរ

  // បើគាត់អូសទៅឆ្វេងលើសពី ៥០px ហើយមិនមែនជាការអូសឡើងចុះ (Scroll)
  if (deltaX > 50 && deltaY < 40) {
    deleteNotification(id)
  }
}

// មុខងារលុប និងដាក់ Animation
function deleteNotification(id) {
  const el = document.getElementById('notif-' + id)
  if (el) {
    // ដាក់ Class ឱ្យវារត់ចេញទៅឆ្វេងយ៉ាង Smooth
    el.classList.add('swiped-out-left')
    
    // រង់ចាំ 0.3s ឱ្យ Animation ដើរចប់ សឹមលុបចេញពី Data
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
      // អាប់ដេតលេខលើកណ្តឹង
      unreadCount.value = notifications.value.filter(n => !n.read).length
      
      // បើចង់ឱ្យលុបចូលទៅក្នុង LocalStorage ឬ API អាចបន្ថែមនៅទីនេះបាន
    }, 300)
  }
}

function setHomeCategory(val) {
  activeCategory.value = val
  homeSearch.value = ''
}

function filterLibrary(val) { activeLibCategory.value = val }
function applyLibraryFilters() { /* computed handles it */ }

function stockClass(stock) {
  if (stock === 0) return 'st-stock-out'
  if (stock <= 3) return 'st-stock-low'
  return 'st-stock-ok'
}
function stockText(stock) {
  if (stock === 0) return t('st_out', 'Out Stock')
  if (stock <= 3) return t('st_low', 'Low Stock')
  return t('st_avail', 'Available')
}

function filterBooks() { /* computed handles it */ }

function syncSearch() { homeSearch.value = stickySearch.value }

function openDetail(id) {
  selectedBook.value = allBooks.value.find(b => b.id === id) || null
  showDetail.value = true
}
function closeDetail() { showDetail.value = false }

function toggleSaveFromDetail() {
  if (selectedBook.value) toggleSave(selectedBook.value.id, null)
}

async function toggleSave(id, btn) {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) { showToast('Please log in to save books.', 'error'); return }
  const idx = savedIds.value.indexOf(id)
  if (idx > -1) savedIds.value.splice(idx, 1)
  else savedIds.value.push(id)
  localStorage.setItem('favBooks', JSON.stringify(savedIds.value))

  try {
    const data = await usersApi.toggleFavorite(u.email, id)
    if (data.success) savedIds.value = data.favorites || savedIds.value
  } catch (e) { console.error(e) }
}

function rateBook(id, rating) {
  userRatings.value[id] = rating
  localStorage.setItem('userRatings', JSON.stringify(userRatings.value))
}

function handleBorrowAction() {
  if (!selectedBook.value) return
  if (!activeReq.value) {
    if (selectedBook.value.stock > 0) openBorrowModal()
    return
  }
  if (activeReq.value.status === 'approved') {
    pendingReturnId.value = selectedBook.value.id
    showReturnModal.value = true
  }
}

function openBorrowModal() {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  borrowForm.value = { start: today, end: nextWeek }
  showBorrowModal.value = true
}

async function submitBorrowRequest() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u || !selectedBook.value) return

  // ១. បើកផ្ទាំង Loading វិលៗ ពេលចាប់ផ្តើមផ្ញើសំណើ
  isLoading.value = true

  try {
    const data = await requestsApi.borrowBook({
      email: u.email,
      book_id: selectedBook.value.id,
      book_title: selectedBook.value.title,
      start_date: borrowForm.value.start,
      end_date: borrowForm.value.end
    })
    
    if (data.success) {
      // ២. បង្ហាញសារ Alert ជោគជ័យ ដោយប្រើមុខងារបកប្រែ t()
      showToast(t('borrow_success_msg', 'Request submitted successfully!'), 'success')
      
      // បិទផ្ទាំង Form ខ្ចីសៀវភៅ
      showBorrowModal.value = false
      
      // ទាញយកទិន្នន័យសាជាថ្មី ដើម្បី Update ស្ថានភាពសៀវភៅ
      await fetchMyRequests()
    } else {
      // ៣. បង្ហាញសារ Alert ពេលមាន Error ពី Server (ប្រើការបកប្រែដូចគ្នា)
      showToast(t('borrow_error_msg', data.message || 'Failed to borrow book'), 'error')
    }
  } catch (e) {
    // ៤. បង្ហាញសារ Error ពេលដាច់អុីនធឺណិត ឬភ្ជាប់ទៅ Server មិនបាន
    showToast(t('error_connection', 'Connection error. Please try again.'), 'error')
  } finally {
    // ៥. បិទផ្ទាំង Loading វិញជានិច្ច ទោះបីជាផ្ញើជោគជ័យ ឬមានបញ្ហាក៏ដោយ
    isLoading.value = false
  }
}

function returnFromShelf(e, id) {
  if (e) e.stopPropagation()
  pendingReturnId.value = id
  showReturnModal.value = true
}

async function submitReturn() {
  if (!pendingReturnId.value) return
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  const id = pendingReturnId.value
  try {
    const activeReqForReturn = myRequests.value.find(r => r.book_id === id && r.status === 'approved')
    const data = await requestsApi.returnBook({
      request_id: activeReqForReturn?.id,
      email: u.email,
      book_id: id
    })
    if (data.success) {
      showReturnModal.value = false
      showToast('Return request sent successfully!', 'success')
      await fetchMyRequests()
    } else {
      showToast(data.message, 'error')
    }
  } catch (e) { showToast('Connection error', 'error') }
  pendingReturnId.value = null
}

function openPdf() {
  if (selectedBook.value?.pdf) window.open(selectedBook.value.pdf, '_blank')
}

// ===== Profile =====
function toggleTheme() {
  // រក្សាទុកជម្រើស Theme ទៅក្នុង LocalStorage
  localStorage.setItem('theme', isLightMode.value ? 'light' : 'dark')
  
  // បញ្ជាឱ្យបញ្ចូល ឬដក Class 'light-mode' ពី <body> របស់ HTML
  if (isLightMode.value) {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
}

async function saveProfilePro() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) return
  try {
    const data = await usersApi.updateProfile({ email: u.email, name: editForm.value.name, phone: editForm.value.phone, bio: editForm.value.bio })
    if (data.success) {
      sessionStorage.setItem('currentUser', JSON.stringify(data.user))
      currentUser.value = data.user
      showEditForm.value = false
      showToast('Profile updated successfully', 'success')
    } else {
      showToast('Error: ' + data.message, 'error')
    }
  } catch (e) { console.error(e) }
}

function checkPassStrength(pw) {
  if (!pw) { passStrength.value = 0; passStrengthMsg.value = t('pass_str_empty','Strength: Empty'); return }
  if (pw.length < 6) { passStrength.value = 1; passStrengthMsg.value = t('pass_str_weak','Too weak'); return }
  if (pw.length < 10) { passStrength.value = 2; passStrengthMsg.value = t('pass_str_med','Better, still needs work'); return }
  passStrength.value = 3; passStrengthMsg.value = t('pass_str_strong','Strong Password')
}

async function submitChangePassword() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) return
  if (passForm.value.new !== passForm.value.confirm) { showToast('New passwords do not match!', 'error'); return }
  if (passForm.value.new.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return }
  try {
    const data = await usersApi.changePassword({ email: u.email, old_password: passForm.value.old, new_password: passForm.value.new })
    if (data.success) {
      showToast('Security settings updated successfully!', 'success')
      passForm.value = { old: '', new: '', confirm: '' }
      switchView('profile')
    } else {
      showToast(data.message || 'Failed to update password.', 'error')
    }
  } catch (e) { showToast('Connection lost.', 'error') }
}

function setLanguageHandler(lang) {
  setLanguage(lang)
  showToast(lang === 'en' ? 'Language switched to English' : 'ភាសាត្រូវបានប្តូរទៅជា ខ្មែរ')
}

function saveGoal() {
  localStorage.setItem('userReadingGoal', goalValue.value)
  showToast(`${t('goal_toast_success','Goal updated! Target:')} ${goalValue.value}`)
  switchView('profile')
}

function saveNotif(e) {
  showToast(t('nset_saved','Preferences Saved Successfully'))
  setTimeout(() => switchView('profile'), 1000)
}

function loadReadingHistory() { switchView('reading-history') }

function submitSuggestion() {
  showToast(t('sug_msg_success','Suggestion received. Thank you!'), 'success')
  sugForm.value = { title: '', author: '', reason: '' }
  switchView('profile')
}

function submitDonate() {
  showToast(t('don_msg_success','Donation request registered. Thank you!'), 'success')
  donForm.value = { title: '', condition: 'new', date: new Date().toISOString().split('T')[0] }
  switchView('profile')
}

function submitReport() {
  showToast(t('rep_msg_success','Report sent to support team.'), 'success')
  repForm.value = { type: 'bug', desc: '' }
  switchView('profile')
}

function submitContactForm() {
  showToast(t('cont_msg_success','Message sent successfully!'), 'success')
  contactForm.value = { subject: '', message: '' }
  switchView('profile')
}

function openMap() {
  window.open('https://www.google.com/maps/place/Digital+University+of+Cambodia', '_blank')
}

async function downloadCard() { showToast('Card saved to photos', 'success') }
async function shareCard() { showToast('Sharing...', 'success') }

// ១. មុខងារនេះគ្រាន់តែហៅផ្ទាំង Popup ឱ្យលោតចេញមក (ភ្ជាប់ជាមួយប៊ូតុង Logout ចាស់)
function logout() {
  showLogoutModal.value = true
}

// ២. មុខងារនេះទើបជាការ Logout ពិតប្រាកដ (ដំណើរការពេលគេចុចពាក្យ "ចាកចេញ" លើផ្ទាំង Popup)
async function confirmLogout() {
  // ១. បិទផ្ទាំងសួររំលឹក (Modal)
  showLogoutModal.value = false
  
  // ២. បើកផ្ទាំង Loading វិលៗ (Global Loader)
  isLoading.value = true
  
  try {
    const u = JSON.parse(sessionStorage.getItem('currentUser'))
    if (u) {
      // ធ្វើការហៅ API ដើម្បីប្រាប់ Server ថាគណនីនេះបាន Logout
      await authApi.logout(u.email, sessionStorage.getItem('session_id'))
    }
    
    // លុបទិន្នន័យចេញពីម៉ាសុីន
    sessionStorage.removeItem('currentUser')
    sessionStorage.removeItem('session_id')
    
    // កត់ត្រាសារជោគជ័យ
    sessionStorage.setItem('flashMessage', 'បានចាកចេញពីគណនីដោយជោគជ័យ!')
    
    // ៣. លោតទៅទំព័រ Login
    router.push('/')
    
  } catch (error) {
    console.error('Logout error:', error)
    showToast('មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ Server', 'error')
  } finally {
    // ៤. បិទ Loading វិញជានិច្ច ទោះបីជាជោគជ័យ ឬមាន Error ក៏ដោយ
    isLoading.value = false
  }
}

// ===== DATA FETCHING =====
async function fetchBooks() {
  try {
    const data = await booksApi.getBooks()
    if (data.success) allBooks.value = data.data || []
  } catch (e) { console.error(e) }
}

async function fetchMyRequests() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) return
  try {
    const data = await requestsApi.myRequests(u.email)
    myRequests.value = Array.isArray(data) ? data : []
  } catch (e) { console.error(e) }
}

async function sendPulse() {
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) return
  try { await authApi.heartbeat(u.email, sessionStorage.getItem('session_id')) } catch (e) {}
}

// បន្ថែមមុខងារ watch នេះដើម្បីត្រួតពិនិត្យពេលផ្ទាំង Detail បើកឬបិទ
watch(showDetail, (isOpen) => {
  if (isOpen) {
    // ពេលបើកផ្ទាំង Detail បិទមិនឱ្យ Scroll ខាងក្រោយបាន
    document.body.style.overflow = 'hidden';
  } else {
    // ពេលបិទផ្ទាំង Detail បើកឱ្យ Scroll បានធម្មតាវិញ
    document.body.style.overflow = '';
  }
});

// ===========================
// LIFECYCLE
// ===========================
onMounted(async () => {
  // ១. កំណត់ Theme ជា Light សម្រាប់ User ថ្មី
  let savedTheme = localStorage.getItem('theme')
  if (!savedTheme) {
    savedTheme = 'light'
    localStorage.setItem('theme', 'light') // Save ចូលម៉ាសុីនភ្លាមៗ
  }
  isLightMode.value = savedTheme === 'light'
  
  if (isLightMode.value) {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
  
  const u = JSON.parse(sessionStorage.getItem('currentUser'))
  if (!u) { router.push('/'); return }
  currentUser.value = u

  // ២. ឆែកមើលសារ Flash Message ពី Login
  const flashMsg = sessionStorage.getItem('flashMessage')

  // ៣. បើ "គ្មាន" សារហោះមកពី Login ទេ (ឧ. គាត់ Refresh ទំព័រ) ទើបយើងបង្ហាញ Loading
  if (!flashMsg) {
    isLoading.value = true
  } else {
    // បើមានសារ (ទើប Login ជោគជ័យ) យើងបង្ហាញសារ រួចអត់បើក Loading ទេ!
    showToast(flashMsg, 'success')
    sessionStorage.removeItem('flashMessage')
  }

  // ៤. ទាញយកទិន្នន័យព្រមៗគ្នា (រត់នៅ Background យ៉ាងស្ងាត់ៗបើទើប Login ចូល)
  try {
    await Promise.all([
      loadTranslations(),
      fetchBooks(),
      fetchMyRequests(),
      backgroundCheckNotifs()
    ])
  } catch (e) { 
    console.error(e) 
  }
  
  // ៥. បិទ Loading វិញ (ទោះបើកឬមិនបើកក៏ដោយ)
  isLoading.value = false

  // ៦. កូដចាស់បន្តទៀត... (Interval, Card Number...)
  cardNumber.value = `4000 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} 8842`

  editForm.value = { name: u.name || '', phone: u.phone || '', bio: u.bio || '' }

  notifInterval = setInterval(backgroundCheckNotifs, 5000)
  heartbeatInterval = setInterval(sendPulse, 30000)
  sendPulse()

  autoScrollInterval = setInterval(() => {
    if (!carouselRef.value || allBooks.value.length === 0) return
    const c = carouselRef.value
    if (c.scrollLeft >= c.scrollWidth - c.offsetWidth - 10) c.scrollTo({ left: 0, behavior: 'smooth' })
    else c.scrollBy({ left: c.offsetWidth, behavior: 'smooth' })
  }, 4000)

  const appFrame = document.querySelector('.app-frame')
  if (appFrame) appFrame.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  clearInterval(notifInterval)
  clearInterval(heartbeatInterval)
  clearInterval(autoScrollInterval)
  const appFrame = document.querySelector('.app-frame')
  if (appFrame) appFrame.removeEventListener('scroll', handleScroll)
})

let lastScrollTop = 0
function handleScroll(e) {
  const scrollTop = e.target.scrollTop
  if (currentView.value === 'home' && scrollTop > 150) {
    const diff = lastScrollTop - scrollTop
    if (diff > 5) showStickySearch.value = true
    else if (diff < -5) showStickySearch.value = false
  } else {
    showStickySearch.value = false
  }
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
}
</script>

<style>
@import url('../assets/css/dashboard.css');
</style>