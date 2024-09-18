let contentScrollPosition = 0;
Init_UI();
let selectedCategory = "";

function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    
    DDMenu.empty();
    
    DDMenu.append(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
    `);
    
    DDMenu.append(`<div class="dropdown-divider"></div>`);
    
    categories.forEach((category, index) => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append(`
            <div class="dropdown-item menuItemLayout category" data-category="${category}" id="categoryCmd${index}">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `);
    });
    
    DDMenu.append(`<div class="dropdown-divider"></div>`);
    DDMenu.append(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `);

    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        renderBookmarks();
    });
    
    $('.category').on("click", function () {
        selectedCategory = $(this).data('category');
        renderBookmarks();
    });
}

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(`
        <div class="aboutContainer">
            <h2>Gestionnaire de favoris</h2>
            <hr>
            <p>Petite application de gestion de favoris à titre de démonstration d'interface utilisateur monopage réactive.</p>
            <p>Auteur: Nicolas Chourot</p>
            <p>Collège Lionel-Groulx, automne 2024</p>
        </div>
    `);
}

async function renderBookmarks() {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = await API_GetBookmarks();
    eraseContent();
    
    if (bookmarks !== null) {
        let categories = [...new Set(bookmarks.map(bookmark => bookmark.Category))];
        
        updateDropDownMenu(categories);
        
        bookmarks.forEach(bookmark => {
            if (selectedCategory === "" || bookmark.Category === selectedCategory) {
                $("#content").append(renderBookmark(bookmark));
            }
        });
        restoreContentScrollPosition();
        
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        
        $(".bookmarkRow").on("click", function (e) {
            e.preventDefault();
        });
    } else {
        renderError("Service introuvable");
    }
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append(`<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>`);
}

function eraseContent() {
    $("#content").empty();
}

function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}

function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}

function renderError(message) {
    eraseContent();
    $("#content").append(`
        <div class="errorContainer">
            ${message}
        </div>
    `);
}

function renderCreateBookmarkForm() {
    renderBookmarkForm();
}

async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await API_GetBookmark(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Favori introuvable!");
}

async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await API_GetBookmark(id);
    eraseContent();
    
    if (bookmark !== null) {
        $("#content").append(`
            <div class="bookmarkdeleteForm">
                <h4>Effacer le favori suivant?</h4><br>
                <div class="bookmarkRow" bookmark_id=${bookmark.Id}>
                    <div class="bookmarkContainer">
                        <div class="bookmarkLayout">
                            <div class="bookmarkTitle">${bookmark.Title}</div>
                            <div class="bookmarkUrl">${bookmark.Url}</div>
                            <div class="bookmarkCategory">${bookmark.Category}</div>
                        </div>
                    </div>  
                </div>   
                <br>
                <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
                <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            </div>    
        `);
        
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteBookmark(bookmark.Id);
            if (result)
                renderBookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Favori introuvable!");
    }
}

function newBookmark() {
    return {
        Id: 0,
        Title: "",
        Url: "",
        Category: ""
    };
}

function getFaviconUrl(url) {
    try {
        let parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
    } catch (e) {
        return '';
    }
}

function updateFaviconPreview() {
    let url = $('#Url').val();
    let faviconUrl = getFaviconUrl(url);
    let img = $('#faviconPreview');

    if (url && faviconUrl) {
        let tempImg = new Image();
        tempImg.onload = function () {
            img.attr('src', faviconUrl);
        };
        tempImg.onerror = function () {
            img.attr('src', 'bookmark-star.svg');
        };
        tempImg.src = faviconUrl;
    } else {
        img.attr('src', 'bookmark-star.svg');
    }
}

function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = (bookmark == null);
    if (create) bookmark = newBookmark();
    
    $("#actionTitle").text(create ? "Création" : "Modification");
    
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>
            <img id="faviconPreview" src="${getFaviconUrl(bookmark.Url)}" alt="Favicon Preview" style="display: block; width: 64px; height: 64px; margin-bottom: 10px;"/>
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="Url"
                required
                value="${bookmark.Url}" 
                oninput="updateFaviconPreview()"
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Alpha"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    updateFaviconPreview();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let formData = new FormData(this);
        
        showWaitingGif();
        let result = await API_SaveBookmark(formData, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(bookmark) {
    let faviconUrl = getFaviconUrl(bookmark.Url);
    return $(`
        <div class="bookmarkRow" bookmark_id="${bookmark.Id}">
            <div class="bookmarkContainer noselect">
                <div class="bookmarkLayout">
                    <span class="bookmarkTitle">
                        <img src="${faviconUrl}" class="bookmarkFavicon"/>
                        ${bookmark.Title}
                    </span>
                    <a href="${bookmark.Url}" class="bookmarkCategory">${bookmark.Category}</a>
                </div>
                <div class="bookmarkCommandPanel">
                    <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                    <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
                </div>
            </div>
        </div>           
    `);
}