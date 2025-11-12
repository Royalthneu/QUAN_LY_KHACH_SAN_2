// ========================== Ung_dung.js ==========================
// Ứng dụng chính Express cho Quản lý Khách sạn 2
// ---------------------------------------------------------------
const EXPRESS = require("express");
const SESSION = require("express-session");
const PATH = require("path");
const Xu_ly = require("./XL_3L");
const Ung_dung = EXPRESS();

Ung_dung.use(SESSION({ secret: "KS2_Secret", resave: false, saveUninitialized: true }));
Ung_dung.use(EXPRESS.urlencoded({ extended: true }));
Ung_dung.use(EXPRESS.json());
Ung_dung.use("/Media", EXPRESS.static(PATH.join(__dirname, "Du_lieu", "Media")));
Ung_dung.listen(3002, () => console.log("http://localhost:3002"));

var Chuoi_HTML_Khung = Xu_ly.Doc_Khung_HTML();

// ===== ROUTES =====
Ung_dung.get("/", XL_Khoi_dong);
Ung_dung.post("/Tra_cuu_Phong_trong", XL_Tra_cuu_Phong_trong);
Ung_dung.post("/Dang_nhap", XL_Dang_nhap);
Ung_dung.get("/Dang_xuat", XL_Dang_xuat);

// --- Quan ly phieu ---
Ung_dung.get("/Quan_ly_Phieu", Yeu_cau_Vai_tro(["Tiep_tan"]), XL_Quan_ly_Phieu);
Ung_dung.post("/Chon_Lap_Phieu", Yeu_cau_Vai_tro(["Tiep_tan"]), XL_Chon_Lap_Phieu);
Ung_dung.post("/Lap_Phieu", Yeu_cau_Vai_tro(["Tiep_tan"]), XL_Lap_Phieu);
Ung_dung.get("/Chon_Sua_Phieu", Yeu_cau_Vai_tro(["Tiep_tan", "Quan_ly", "Ban_Giam_doc"]), XL_Chon_Sua_Phieu);
Ung_dung.post("/Sua_Phieu", Yeu_cau_Vai_tro(["Tiep_tan", "Quan_ly", "Ban_Giam_doc"]), XL_Sua_Phieu);
Ung_dung.post("/Huy_Phieu", Yeu_cau_Vai_tro(["Tiep_tan", "Quan_ly", "Ban_Giam_doc"]), XL_Huy_Phieu);
Ung_dung.get("/Chon_Tra_cuu_Phieu", Yeu_cau_Vai_tro(["Tiep_tan", "Quan_ly", "Ban_Giam_doc"]), XL_Chon_Tra_cuu_Phieu);
Ung_dung.post("/Tra_cuu_Phieu", XL_Tra_cuu_Phieu);
Ung_dung.post("/Ajax_Danh_sach_Phong_trong", XL_Ajax_Danh_sach_Phong_trong);

// --- Báo cáo Tháng + Năm ---
Ung_dung.get("/Chon_Bao_cao_Thang", Yeu_cau_Vai_tro(["Quan_ly", "Ban_Giam_doc"]), XL_Chon_Bao_cao_Thang);
Ung_dung.get("/Chon_Bao_cao_Nam", Yeu_cau_Vai_tro(["Quan_ly", "Ban_Giam_doc"]), XL_Chon_Bao_cao_Nam);
Ung_dung.get("/Bao_cao_Thu_Thang", Yeu_cau_Vai_tro(["Quan_ly", "Ban_Giam_doc"]), XL_Bao_cao_Thu_Thang);
Ung_dung.get("/Bao_cao_Thu_Nam", Yeu_cau_Vai_tro(["Quan_ly", "Ban_Giam_doc"]), XL_Bao_cao_Thu_Nam);

// --- Xem/Sửa Đơn giá ---
Ung_dung.get("/Xem_Don_gia", Yeu_cau_Vai_tro(["Ban_Giam_doc"]), XL_Xem_Don_gia_GET);
Ung_dung.post("/Xem_Don_gia", Yeu_cau_Vai_tro(["Ban_Giam_doc"]), XL_Xem_Don_gia_POST);
Ung_dung.post("/Don_gia/Xem", Yeu_cau_Vai_tro(["Ban_Giam_doc"]), XL_Don_gia_Xem_Period);
Ung_dung.post("/Don_gia/Cap_nhat", Yeu_cau_Vai_tro(["Ban_Giam_doc"]), XL_Don_gia_Cap_nhat);
Ung_dung.post("/Cap_nhat_Gia", Yeu_cau_Vai_tro(["Ban_Giam_doc"]), XL_Cap_nhat_Gia);

// ===== HANDLERS =====
function XL_Khoi_dong(req, res) {
    const thong_bao = req.session?.Thong_bao || "";
    if (thong_bao) req.session.Thong_bao = null; // hiển thị 1 lần rồi xóa

    const html_tb = thong_bao
        ? `<div class="container mt-2">
           <div class="alert alert-danger">${thong_bao}</div>
         </div>`
        : "";

    let html = Xu_ly.Tao_Chuoi_HTML_Tra_cuu_Phong({ Vai_tro: req.session?.Vai_tro || "Khach" });
    Render(res, Menu_Chuc_nang(req) + html_tb + html);
}
function Yeu_cau_Vai_tro(ds) {
    return (req, res, next) => {
        const v = req.session?.Vai_tro || "Khach";
        if (!ds.includes(v)) return res.redirect("/");
        next();
    };
}
function Render(res, html) {
    res.send(Chuoi_HTML_Khung.replace("Chuoi_HTML", html));
}
function XL_Dang_nhap(req, res) {
    const { Ten_dang_nhap, Ten_Dang_nhap, Mat_khau } = req.body || {};
    const Ten = Ten_Dang_nhap || Ten_dang_nhap;
    const u = Xu_ly.Xac_thuc(x => x.Ten_Dang_nhap === Ten && x.Mat_khau === Mat_khau);

    if (u)
    {
        req.session.Vai_tro = Xu_ly.Suy_dien_Vai_tro(u);
        req.session.Khu_vuc = (u.Khu_vuc?.Ma_so || u.Khu_vuc || u.Don_vi?.Khu_vuc || u.Don_vi?.Ma_so || "").toString();
    } else
    {
        req.session.Thong_bao = "Đăng nhập không thành công. Vui lòng kiểm tra tên đăng nhập hoặc mật khẩu.";
    }
    res.redirect("/");
}
function XL_Dang_xuat(req, res) {
    req.session.destroy(() => res.redirect("/"));
}

function Menu_Chuc_nang(req) {
    const v = req.session?.Vai_tro || "Khach";
    const nut = (url, ten) =>
        `<form method="${url.startsWith('/Tra_cuu') ? 'post' : 'get'}" action="${url}" class="d-inline" style="margin-left:10px;">
         <button class="btn btn-sm btn-outline-primary" >${ten}</button>
       </form>`;

    let ds = [nut("/", "Trang chủ")];
    if (v !== "Khach") ds.push(nut("/Chon_Tra_cuu_Phieu", "Tra cứu phiếu"));
    if (v === "Tiep_tan") ds.push(nut("/Quan_ly_Phieu", "Quản lý phiếu"));

    if (["Quan_ly", "Ban_Giam_doc"].includes(v)) ds.push(nut("/Chon_Bao_cao_Thang", "Báo cáo tháng"));
    if (["Quan_ly", "Ban_Giam_doc"].includes(v)) ds.push(nut("/Chon_Bao_cao_Nam", "Báo cáo năm"));
    if (v === "Ban_Giam_doc") ds.push(nut("/Xem_Don_gia", "Xem Đơn giá"));

    const modal = `
        <style>
        .overlay{position:fixed; inset:0; background:rgba(0,0,0,.35); display:none; z-index:1050;}
        .overlay.show{display:block;}
        .modal-card{position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            width:min(520px,92vw); background:#fff; border-radius:.75rem; box-shadow:0 1rem 2rem rgba(0,0,0,.2);}
        </style>

        <div id="LoginOverlay" class="overlay">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="LoginTitle">
            <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 class="mb-0" id="LoginTitle">Đăng nhập hệ thống</h6>
            <button class="btn btn-sm btn-light" type="button"
                    onclick="document.getElementById('LoginOverlay').classList.remove('show')">✕</button>
            </div>
            <div class="p-3">
            <form method="post" action="/Dang_nhap" class="row g-2" id="Frm_Dang_nhap">
                <div class="col-12">
                <label class="form-label mb-1">Tên đăng nhập</label>
                <input name="Ten_Dang_nhap" class="form-control" autocomplete="username" required>
                </div>
                <div class="col-12">
                <label class="form-label mb-1">Mật khẩu</label>
                <input name="Mat_khau" type="password" class="form-control" autocomplete="current-password" required>
                </div>
                <div class="col-12 d-flex justify-content-end gap-2">
                <!-- Nút HỦY -->
                <button type="button" class="btn btn-secondary mt-1"
                        onclick="document.getElementById('LoginOverlay').classList.remove('show')">Hủy</button>
                <!-- Nút ĐĂNG NHẬP -->
                <button type="submit" class="btn btn-success mt-1">Đăng nhập</button>
                </div>
            </form>
            </div>
        </div>
        </div>`;

    const panelPhai = `
      <div class="text-end" style="min-width:280px;">
        <div class="text-info" style="font-size:1rem;">Xin chào ${v}</div>
        ${v === "Khach"
            ? `<button type="button" class="btn btn-sm btn-primary mt-1"
                   onclick="document.getElementById('LoginOverlay').classList.add('show')">
                 Đăng nhập
               </button>`
            : `<a class="btn btn-sm btn-danger mt-1" href="/Dang_xuat">Đăng xuất</a>`
        }
      </div>`;

    return `
      <div class="container-fluid py-2 border-bottom bg-white">
        <div class="d-flex justify-content-between align-items-start flex-wrap">
          <div class="d-flex flex-wrap">${ds.join("")}</div>
          ${panelPhai}
        </div>
      </div>
      ${modal}
      <script>
        // Chặn click nổi bọt trong thẻ modal-card để không đóng overlay
        (function(){
          const ovl = document.getElementById('LoginOverlay');
          const card = ovl?.querySelector('.modal-card');
          ovl?.addEventListener('click', function(e){
            // nếu click trực tiếp vào overlay (nền tối) thì KHÔNG làm gì
            // => không đóng popup
          });
          card?.addEventListener('click', function(e){ e.stopPropagation(); });
        })();
      </script>`;
}
function XL_Tra_cuu_Phong_trong(req, res) {
    try
    {
        const Tu = req.body.Tu_ngay, Den = req.body.Den_ngay;
        const Loc = {
            Khu_vuc: req.body.Khu_vuc || "",
            Loai_phong: req.body.Loai_phong || "",
            Tang: req.body.Tang || "",   // << thêm dòng này
            So_khach: +(req.body.So_khach || 1)
        };
        const Kq = Xu_ly.Tra_cuu_Phong_trong(
            Xu_ly.Doc_Danh_sach_Phong(), Xu_ly.Doc_Danh_sach_Phieu_thue(), Tu, Den, Loc
        );
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Danh_sach_Phong_trong(Kq, { Tu_ngay: Tu, Den_ngay: Den, Loc }));
    } catch (e)
    {
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi: " + e.message));
    }
}
function XL_Ajax_Danh_sach_Phong_trong(req, res) {
    try
    {
        const body = req.body || {};
        const Tu = body.Tu_ngay;
        const Den = body.Den_ngay;
        if (!Tu || !Den) return res.status(400).json({ Loi: "Thiếu ngày" });

        // Loc từ client (vẫn chấp nhận)…
        const Loc = {
            Khu_vuc: body.Khu_vuc || "",
            Loai_phong: body.Loai_phong || "",
            Tang: body.Tang || ""
        };

        // …nhưng nếu là TIẾP TÂN thì ép theo khu trong session
        const vai_tro = req.session?.Vai_tro || "Khach";
        const kv_sess = req.session?.Khu_vuc || req.session?.KV || req.session?.Ma_khu || "";
        if (vai_tro === "Tiep_tan" && kv_sess)
        {
            Loc.Khu_vuc = kv_sess;  // <-- chỉ xem phòng của khu này
        }

        const Kq = Xu_ly.Tra_cuu_Phong_trong(
            Xu_ly.Doc_Danh_sach_Phong(),
            Xu_ly.Doc_Danh_sach_Phieu_thue(),
            Tu, Den, Loc
        );
        res.json(Kq);
    } catch (e)
    {
        console.error("Lỗi /Ajax_Danh_sach_Phong_trong:", e);
        res.status(500).json({ Loi: e.message || String(e) });
    }
}


function XL_Quan_ly_Phieu(req, res) {
    const user = {
        Vai_tro: req.session?.Vai_tro || "Khach",
        Khu_vuc: req.session?.Khu_vuc ?? "" // string hoặc {Ma_so, Ten}
    };

    const ds_all = Xu_ly.Doc_Danh_sach_Phieu_thue() || [];

    // Chuẩn hoá Khu_vuc session -> chữ A/B/C
    const kvLetter = (kv) => {
        let t = kv;
        if (kv && typeof kv === "object") t = kv.Ma_so || kv.Ten || "";
        t = String(t || "").toUpperCase().trim();

        // KV_1 / KV-2 / KV3 -> số, map 1->A, 2->B, 3->C, ...
        let m = t.match(/^KV[_\-\s]*(\d+)$/);
        if (m)
        {
            const n = parseInt(m[1], 10);
            if (n >= 1 && n <= 26) return String.fromCharCode(64 + n);
        }
        // KV_A / KV-A -> lấy chữ
        m = t.match(/^KV[_\-\s]*([A-Z])$/);
        if (m) return m[1];

        // "KHU VUC A" -> A
        m = t.match(/KHU.*?([A-Z])$/);
        if (m) return m[1];

        // cuối cùng: tìm A/B/C trong chuỗi
        m = t.match(/([ABC])/);
        return m ? m[1] : "";
    };

    const need = (user.Vai_tro === "Tiep_tan") ? kvLetter(user.Khu_vuc) : "";

    // Lấy khu từ số phòng: "A-0101" -> A, "C-510" -> C
    const kvFromPhong = (sp) => String(sp || "").toUpperCase().trim().charAt(0);

    const ds = need ? ds_all.filter(p => kvFromPhong(p.So_phong) === need) : ds_all;

    const html_ds = Xu_ly.Tao_Chuoi_HTML_Danh_sach_Phieu(ds, user);
    const btn_lap = `
      <div class="container">
        <div class="d-flex justify-content-end mb-2">
          <form method="post" action="/Chon_Lap_Phieu">
            <input type="hidden" name="So_phong" value="">
            <input type="hidden" name="Tu_ngay" value="">
            <input type="hidden" name="Den_ngay" value="">
            <button class="btn btn-success">+ Lập phiếu</button>
          </form>
        </div>
      </div>`;

    Render(res, Menu_Chuc_nang(req) + btn_lap + html_ds);
}
function XL_Chon_Tra_cuu_Phieu(req, res) {
    const user = {
        Vai_tro: req.session?.Vai_tro || "Khach",
        Khu_vuc: req.session?.Khu_vuc || ""
    };
    const filter = {};
    const kq = [];
    Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Tra_cuu_Phieu(user, filter, kq));
}
function XL_Chon_Lap_Phieu(req, res) {
    const { So_phong, Tu_ngay, Den_ngay } = req.body;
    const p = (Xu_ly.Doc_Danh_sach_Phong() || []).find(x => x.So_phong === So_phong);
    const lp = p?.Loai_phong || "Standard";
    Render(res, Menu_Chuc_nang(req) +
        Xu_ly.Tao_Chuoi_HTML_Lap_Phieu({ So_phong, Tu_ngay, Den_ngay, Loai_phong: lp }));
}
function XL_Lap_Phieu(req, res) {
    try
    {
        const B = req.body || {};

        // helper lấy giá trị theo nhiều key ứng viên
        const pick = (...keys) => {
            for (const k of keys)
            {
                const v = B[k];
                if (v !== undefined && String(v).trim() !== "") return String(v).trim();
            }
            return "";
        };

        // gom khách (đọc được cả Ho_ten_KH1/CCCD_KH1 và Khach_1_Ho_ten/Khach_1_CCCD)
        const Ds_khach = [];
        for (let i = 1; i <= 4; i++)
        {
            const Ho_ten = pick(`Ho_ten_KH${i}`, `Khach_${i}_Ho_ten`);
            const CCCD = pick(`CCCD_KH${i}`, `Khach_${i}_CCCD`);
            const Dien_thoai = pick(`Dien_thoai_KH${i}`, `Khach_${i}_Dien_thoai`);
            if (Ho_ten || CCCD || Dien_thoai) Ds_khach.push({ Ho_ten, CCCD, Dien_thoai });
        }

        // SUY RA loại phòng nếu form không gửi kèm
        let Loai_phong = pick("Loai_phong");
        if (!Loai_phong)
        {
            const p = (Xu_ly.Doc_Danh_sach_Phong() || []).find(x => x.So_phong === B.So_phong);
            Loai_phong = p?.Loai_phong || "";
        }

        const Phieu = {
            Ma_phieu: Xu_ly.Lay_Ma_Phieu_thue_Tiep_theo(),
            So_phong: B.So_phong,
            Loai_phong,
            // đọc đúng tên field ngày từ form
            Ngay_nhan: B.Tu_ngay,
            Ngay_tra: B.Den_ngay,
            So_khach: Ds_khach.length || Number(B.So_khach || 1),
            Danh_sach_khach: Ds_khach
        };

        const Kq = Xu_ly.Xu_ly_Lap_Phieu(Phieu);
        Render(res, Menu_Chuc_nang(req) +
            Xu_ly.Tao_Chuoi_HTML_Thong_bao(
                `Đã ghi phiếu <b>${Phieu.Ma_phieu}</b>. Tiền thuê: ${Number(Kq.Tien_thue || 0).toLocaleString('vi-VN')} đ`
            )
        );
    } catch (e)
    {
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi lập phiếu: " + (e.message || e)));
    }
}

function XL_Chon_Sua_Phieu(req, res) {
    const Ma = req.query.Ma_phieu;
    const pt = Xu_ly.Doc_Phieu_thue(Ma);
    if (!pt) return Render(res, Xu_ly.Tao_Chuoi_HTML_Thong_bao("Không tìm thấy phiếu"));
    Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Sua_Phieu(pt));
}
function XL_Sua_Phieu(req, res) {
    try
    {
        const Ds_khach = [];
        for (let i = 1; i <= 4; i++)
        {
            const H = req.body[`Khach_${i}_Ho_ten`],
                C = req.body[`Khach_${i}_CCCD`],
                D = req.body[`Khach_${i}_Dien_thoai`];
            if (H || C || D) Ds_khach.push({ Ho_ten: H, CCCD: C, Dien_thoai: D });
        }
        const P = {
            Ma_phieu: req.body.Ma_phieu,
            So_phong: req.body.So_phong,
            Loai_phong: req.body.Loai_phong,
            Ngay_nhan: req.body.Ngay_nhan,
            Ngay_tra: req.body.Ngay_tra,
            So_khach: +req.body.So_khach || Ds_khach.length || 1,
            Danh_sach_khach: Ds_khach,
        };
        const Kq = Xu_ly.Xu_ly_Sua_Phieu(P);
        if (Kq && Kq.Loi)
        {
            return Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi sửa phiếu: " + Kq.Loi));
        }
        Render(res, Menu_Chuc_nang(req) +
            Xu_ly.Tao_Chuoi_HTML_Thong_bao("Đã lưu phiếu " + P.Ma_phieu + ". Tiền thuê: " +
                Number(Kq.Tien_thue || 0).toLocaleString("vi-VN") + " đ"));
    } catch (e)
    {
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi sửa phiếu: " + e.message));
    }
}
function XL_Huy_Phieu(req, res) {
    try
    {
        Xu_ly.Xoa_Phieu_thue(req.body.Ma_phieu);
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Đã hủy phiếu " + req.body.Ma_phieu));
    } catch (e)
    {
        Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi hủy phiếu: " + e.message));
    }
}
function XL_Tra_cuu_Phieu(req, res) {
  try {
    const v = req.session?.Vai_tro || "Khach";
    const kvSess = req.session?.Khu_vuc || "";

    // gom filter từ form
    const f = {
      Ma_phieu: (req.body?.Ma_phieu || "").trim(),
      So_phong: (req.body?.So_phong || "").trim(),
      Ho_ten: (req.body?.Ho_ten || "").trim(),
      Loai_phong: (req.body?.Loai_phong || "").trim(),
      Tu_ngay: (req.body?.Tu_ngay || "").trim(),
      Den_ngay: (req.body?.Den_ngay || "").trim(),
      Khu_vuc:  (req.body?.Khu_vuc  || "").trim(),  // NEW
      __submitted: "1"
    };

    // Tiếp tân: luôn dùng khu trong session, bỏ qua giá trị client
    if (v === "Tiep_tan" && kvSess) f.Khu_vuc = kvSess;

    const dsPhieu = Xu_ly.Doc_Danh_sach_Phieu_thue();
    const dsKq    = Xu_ly.Xu_ly_Tra_cuu_Phieu_thue(dsPhieu, f);

    const user = { Vai_tro: v, Khu_vuc: kvSess };
    const html = Xu_ly.Tao_Chuoi_HTML_Tra_cuu_Phieu(user, f, dsKq);
    Render(res, Menu_Chuc_nang(req) + html);
  } catch (err) {
    Render(res, Menu_Chuc_nang(req) + Xu_ly.Tao_Chuoi_HTML_Thong_bao("Lỗi tra cứu: " + err.message));
  }
}

function XL_Chon_Bao_cao_Thang(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Chon_Bao_cao_Thang(user);
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Chon_Bao_cao_Nam(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Chon_Bao_cao_Nam(user);
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Bao_cao_Thu_Thang(req, res) {
    const isPartial =
        String(req.query.partial || "") === "1" ||
        req.get("X-Requested-With") === "fetch";

    let y, m;
    if (req.query.current === "1")
    {
        const d = new Date();
        y = d.getFullYear();
        m = d.getMonth() + 1;
    } else
    {
        y = +(req.query.y || 0);
        m = +(req.query.m || 0);
    }

    const bc = Xu_ly.Lap_Bao_cao_Thu_Thang(y, m);
    const kq = Xu_ly.Tao_Chuoi_HTML_Bao_cao_Thu_Thang(bc, { y, m });

    if (isPartial) return res.send(kq);

    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Chon_Bao_cao_Thang(user) + `<div class="container mt-3">${kq}</div>`;
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Bao_cao_Thu_Nam(req, res) {
    const isPartial =
        String(req.query.partial || "") === "1" ||
        req.get("X-Requested-With") === "fetch";

    let y = req.query.current === "1" ? new Date().getFullYear() : +(req.query.y || 0);

    const bc = Xu_ly.Lap_Bao_cao_Thu_Nam(y);
    const kq = Xu_ly.Tao_Chuoi_HTML_Bao_cao_Thu_Nam(bc, { y });

    if (isPartial) return res.send(kq);

    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Chon_Bao_cao_Nam(user) + `<div class="container mt-3">${kq}</div>`;
    Render(res, Menu_Chuc_nang(req) + html);
}


function XL_Xem_Don_gia_GET(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Don_gia_Hien_tai
        ? Xu_ly.UI_Don_gia_Hien_tai(user)
        : Xu_ly.Tao_Chuoi_HTML_Thong_bao("Chưa hỗ trợ UI Đơn giá");
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Xem_Don_gia_POST(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Don_gia_Hien_tai
        ? Xu_ly.UI_Don_gia_Hien_tai(user)
        : Xu_ly.Tao_Chuoi_HTML_Thong_bao("Chưa hỗ trợ UI Đơn giá");
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Don_gia_Xem_Period(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const period = req.body?.period || "";
    const html = Xu_ly.UI_Don_gia_Xem_Period
        ? Xu_ly.UI_Don_gia_Xem_Period(user, period)
        : Xu_ly.Tao_Chuoi_HTML_Thong_bao("Chưa hỗ trợ xem theo kỳ");
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Don_gia_Cap_nhat(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Don_gia_Cap_nhat
        ? Xu_ly.UI_Don_gia_Cap_nhat(user, req.body || {})
        : Xu_ly.Tao_Chuoi_HTML_Thong_bao("Chưa hỗ trợ cập nhật đơn giá");
    Render(res, Menu_Chuc_nang(req) + html);
}
function XL_Cap_nhat_Gia(req, res) {
    const user = { Vai_tro: req.session?.Vai_tro || "Khach" };
    const html = Xu_ly.UI_Cap_nhat_Gia_Loai_phong
        ? Xu_ly.UI_Cap_nhat_Gia_Loai_phong(user, req.body || {})
        : Xu_ly.Tao_Chuoi_HTML_Thong_bao("Chưa hỗ trợ cập nhật giá loại");
    Render(res, Menu_Chuc_nang(req) + html);
}