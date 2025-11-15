// ======================= XL_3L.js ===============================
// Lớp xử lý 3 tầng: Lưu trữ / Nghiệp vụ / Thể hiện
// ---------------------------------------------------------------
const FS = require("fs");
const PATH = require("path");
const CRYPTO = require("crypto");

// ===== Đường dẫn thư mục dữ liệu =====
const Thu_muc_Du_lieu = PATH.join(__dirname, "Du_lieu");
const Thu_muc_HTML = PATH.join(Thu_muc_Du_lieu, "HTML");
const Thu_muc_Phieu_thue = PATH.join(Thu_muc_Du_lieu, "Phieu_thue");
const Tep_Khach_san = PATH.join(Thu_muc_Du_lieu, "Khach_san", "Khach_san.json");
const Tep_Phong = PATH.join(Thu_muc_Du_lieu, "Phong", "Phong.json");
const Tep_Loai_phong = PATH.join(
  Thu_muc_Du_lieu,
  "Loai_phong",
  "Loai_phong.json"
);
const Tep_Nhan_vien = PATH.join(Thu_muc_Du_lieu, "Nhan_vien", "Nhan_vien.json");
const Tep_Gia_lich_su = PATH.join(
  Thu_muc_Du_lieu,
  "Lich_su_Don_gia",
  "Lich_su_Don_gia.json"
);
const Tep_COUNTER = PATH.join(Thu_muc_Phieu_thue, "COUNTER.json");

class XL_3L {
  Doc_JSON(Duong_dan) {
    try
    {
      if (!FS.existsSync(Duong_dan)) return null;
      const s = FS.readFileSync(Duong_dan, "utf8");
      if (!s || !s.trim()) return null;
      return JSON.parse(s);
    } catch
    {
      return null;
    }
  }
  Doc_Khung_HTML() {
    return FS.readFileSync(PATH.join(Thu_muc_HTML, "Khung.html"), "utf8");
  }
  Doc_Khach_san() {
    return this.Doc_JSON(Tep_Khach_san);
  }
  Doc_Danh_sach_Phong() {
    return this.Doc_JSON(Tep_Phong);
  }
  Doc_Danh_muc_Loai_phong() {
    return this.Doc_JSON(Tep_Loai_phong);
  }
  Doc_Danh_sach_Phieu_thue() {
    const Danh_sach = [];
    if (!FS.existsSync(Thu_muc_Phieu_thue)) return [];
    FS.readdirSync(Thu_muc_Phieu_thue)
      .filter((f) => /^PT_\d{4}\.json$/i.test(f)) // << chỉ lấy PT_####.json
      .forEach((f) => {
        const p = PATH.join(Thu_muc_Phieu_thue, f);
        const obj = this.Doc_JSON(p);
        if (obj) Danh_sach.push(obj);
      });
    return Danh_sach;
  }
  Doc_Phieu_thue(Ma_phieu) {
    const tep = PATH.join(Thu_muc_Phieu_thue, `${Ma_phieu}.json`);
    if (!FS.existsSync(tep)) return null;
    return this.Doc_JSON(tep);
  }
  Doc_Counter_Phieu() {
    try
    {
      return JSON.parse(FS.readFileSync(Tep_COUNTER, "utf8"));
    } catch
    {
      return { last: 0 };
    }
  }
  Doc_Danh_sach_Nhan_vien() {
    if (!FS.existsSync(Tep_Nhan_vien)) return [];
    return this.Doc_JSON(Tep_Nhan_vien);
  }
  Doc_Lich_su_Don_gia(Tu = null, Den = null) {
    const candidates = [
      PATH.join(Thu_muc_Du_lieu, "Don_gia", "Don_gia_Lich_su.json"),
      PATH.join(Thu_muc_Du_lieu, "Lich_su_Don_gia", "Lich_su_Don_gia.json"),
      typeof Tep_Gia_lich_su !== "undefined" ? Tep_Gia_lich_su : null,
    ].filter(Boolean);
    let ds = [];
    for (const p of candidates)
    {
      try
      {
        if (FS.existsSync(p))
        {
          ds = JSON.parse(FS.readFileSync(p, "utf-8") || "[]");
          break;
        }
      } catch { }
    }
    if (!Tu && !Den) return ds;
    const tuISO = Tu ? new Date(Tu).toISOString().slice(0, 10) : null;
    const denISO = Den ? new Date(Den).toISOString().slice(0, 10) : null;
    return ds.filter((x) => {
      const a = x.hieu_luc_tu;
      const b = x.hieu_luc_den || "9999-12-31";
      const ok1 = !tuISO || b >= tuISO;
      const ok2 = !denISO || a <= denISO;
      return ok1 && ok2;
    });
  }

  Ghi_JSON_Atomic(duong_dan, obj) {
    const tmp = duong_dan + ".tmp";
    FS.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
    FS.renameSync(tmp, duong_dan);
  }
  Ghi_Phieu_thue(Phieu) {
    const p = PATH.join(Thu_muc_Phieu_thue, `${Phieu.Ma_phieu}.json`);
    this.Ghi_JSON_Atomic(p, Phieu);
    return true;
  }
  Ghi_Counter_Phieu(obj) {
    FS.writeFileSync(Tep_COUNTER, JSON.stringify(obj));
  }
  Xoa_Phieu_thue(Ma_phieu) {
    const tep = PATH.join(Thu_muc_Phieu_thue, `${Ma_phieu}.json`);
    if (FS.existsSync(tep)) FS.unlinkSync(tep);
    return true;
  }
  Xac_thuc(Predicate) {
    const ds = this.Doc_Danh_sach_Nhan_vien();
    return ds.find(Predicate) || null;
  }

  // ---------------- NGHIỆP VỤ ----------------
  Suy_dien_Vai_tro(Nguoi) {
    const ma = Nguoi?.Bo_phan?.Ma_so || "";
    if (ma.startsWith("TT")) return "Tiep_tan";
    if (ma.startsWith("QL")) return "Quan_ly";
    if (ma.startsWith("BGD")) return "Ban_Giam_doc";
    return "Khach";
  }
  Chuyen_chu_thuong(s = "") {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
  Chuan_Hoa_Ngay(Ngay) {
    const d = new Date(Ngay);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  Tinh_So_ngay(Nhan, Tra) {
    return Math.max(
      0,
      Math.round(
        (this.Chuan_Hoa_Ngay(Tra) - this.Chuan_Hoa_Ngay(Nhan)) /
        (24 * 3600 * 1000)
      )
    );
  }
  Trung_Thoi_Gian(A1, A2, B1, B2) {
    const a1 = this.Chuan_Hoa_Ngay(A1).getTime(),
      a2 = this.Chuan_Hoa_Ngay(A2).getTime(),
      b1 = this.Chuan_Hoa_Ngay(B1).getTime(),
      b2 = this.Chuan_Hoa_Ngay(B2).getTime();
    return a1 < b2 && b1 < a2;
  }
  Kiem_tra_Chong_lan(Ds_Phieu, So_phong, Tu, Den) {
    return Ds_Phieu.some(
      (pt) =>
        pt.So_phong === So_phong &&
        this.Trung_Thoi_Gian(pt.Ngay_nhan, pt.Ngay_tra, Tu, Den)
    );
  }
  Kiem_tra_Chong_lan_Except(Ds_Phieu, Ma_phieu, So_phong, Tu, Den) {
    return Ds_Phieu.some(
      (pt) =>
        pt.Ma_phieu !== Ma_phieu &&
        pt.So_phong === So_phong &&
        this.Trung_Thoi_Gian(pt.Ngay_nhan, pt.Ngay_tra, Tu, Den)
    );
  }
  Lay_Khu_vuc_tu_So_phong(So_phong = "") {
    return String(So_phong).split("-")[0].trim().toUpperCase();
  }
  Tra_cuu_Phong_trong(Ds_Phong, Ds_Phieu, Tu, Den, Loc = {}) {
    const Tu_ngay = this.Chuan_Hoa_Ngay(Tu);
    const Den_ngay = this.Chuan_Hoa_Ngay(Den);
    const DM_Loai = this.Doc_Danh_muc_Loai_phong();
    const Map_Loai_ById = Object.fromEntries(
      DM_Loai.map(l => [String(l.Ma_so).toUpperCase(), { Ten: l.Ten, Suc_chua: l.Suc_chua, Don_gia: l.Don_gia }])
    );
    const Map_Loai_Alias = new Map();
    const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    for (const l of DM_Loai)
    {
      const id = String(l.Ma_so || "").toUpperCase();     // "LP_1"
      const ten = norm(l.Ten || "");                       // "STANDARD"
      const core = id.replace(/^LP_?/, "");               // "1"
      [id, ten, core, `LP_${core}`].forEach(x => Map_Loai_Alias.set(norm(x), id));
    }
    const canonLoai = (v) => {
      if (v && typeof v === "object") v = v.Ma_so || v.Ten || v.Code || "";
      const n = norm(v);
      return Map_Loai_Alias.get(n) || Map_Loai_Alias.get(n.replace(/^LP_?/, "")) || "";
    };

    const KS = this.Doc_Khach_san();
    const Map_KV = new Map();
    for (const k of (KS.Danh_sach_Khu_vuc || []))
    {
      const ma = String(k.Ma_so || "").toUpperCase();     // ví dụ "KV_A" hoặc "KV_1"
      const ten = norm(k.Ten || "");                       // "KHU A" / "KHU VUC A"
      
      // rút ký tự chữ/cuối cùng trong tên ("Khu A" -> "A")
      const mCh = (k.Ten || "").match(/([A-Za-zĐĂÂÊÔƠƯ])\s*$/i);
      const ch = mCh ? mCh[1].toUpperCase() : "";       // "A" (nếu có)
      const core = ma.replace(/^KV_?/, "");               // "A" hoặc "1"

      [ma, ten, ch, core, `KHU ${ch}`, `KV_${core}`, `KV_${ch}`]
        .filter(Boolean)
        .forEach(x => Map_KV.set(norm(x), ma));
    }
    const canonKV = (v) => {
      if (v && typeof v === "object") v = v.Ma_so || v.Ma || v.Code || v.Ten || "";
      const n = norm(v);
      return Map_KV.get(n) || Map_KV.get(n.replace(/^KV_?/, "")) || "";
    };

    const Map_Tang = new Map();
    const getNum = (x) => {
      const m = String(x || "").match(/\d+/);
      return m ? parseInt(m[0], 10) : NaN;
    };
    for (const t of (KS.Danh_sach_Tang || []))
    {
      const code = String(t.Ma_so || "");              // ví dụ "T_A03", "T_3"
      const kv = canonKV(t.Khu_vuc);               // "KV_A" hoặc "KV_1"
      const num = getNum(code);                     // 3
      const ten = norm(t.Ten || "");                  // "TANG 3 KHU A" ...
      const aliases = new Set([
        code.toUpperCase(), ten,
        `T${num}`, String(num), `T_${num}`, `TANG ${num}`, `TANG${num}`,
        `${kv}-${num}`, `${kv}${num}`
      ]);
      aliases.forEach(a => Map_Tang.set(a, { kv, num, code }));
    }
    const canonTang = (v) => {
      const s = String(v || "");
      const tryKeys = [s.toUpperCase(), norm(s), `T${getNum(s)}`];
      for (const k of tryKeys) if (Map_Tang.has(k)) return Map_Tang.get(k);
      const n = getNum(s);
      if (Number.isFinite(n)) return { kv: "", num: n, code: "" }; // chỉ số tầng
      return null;
    };
    const selKV_canon = Loc.Khu_vuc ? canonKV(Loc.Khu_vuc) : "";
    const selTang_obj = (Loc.Tang !== "" && Loc.Tang !== undefined) ? canonTang(Loc.Tang) : null;
    const selLoai_canon = Loc.Loai_phong ? canonLoai(Loc.Loai_phong) : "";
    const Kq = Ds_Phong.filter(p => {
      if (selKV_canon)
      {
        const pv = canonKV(p.Khu_vuc);
        if (!pv || pv !== selKV_canon) return false;
      }
      if (selTang_obj)
      {
        const pNum = getNum(p.Tang);
        const sameNum = Number.isFinite(pNum) && (pNum === selTang_obj.num);
        const sameCode = String(p.Tang || "").toUpperCase() === selTang_obj.code.toUpperCase();
        if (!(sameNum || sameCode)) return false;

        // Nếu tầng đã quy về khu cụ thể thì phòng phải cùng khu
        if (selTang_obj.kv)
        {
          const pv = canonKV(p.Khu_vuc);
          if (!pv || pv !== selTang_obj.kv) return false;
        }
      }
      if (selLoai_canon)
      {
        const pLoai = canonLoai(p.Loai_phong);
        if (!pLoai || pLoai !== selLoai_canon) return false;
      }

      const dsPT = Ds_Phieu.filter(pt => pt.So_phong === p.So_phong);
      return !dsPT.some(pt => this.Trung_Thoi_Gian(pt.Ngay_nhan, pt.Ngay_tra, Tu_ngay, Den_ngay));
    });

    return Kq.map(p => {
      const loaiId = canonLoai(p.Loai_phong);
      const loai = Map_Loai_ById[loaiId] || {};
      return {
        ...p,
        Ten_loai: loai.Ten || p.Loai_phong,
        Suc_chua: loai.Suc_chua || "",
        Gia: loai.Don_gia || 0
      };
    });
  }
  Tra_cuu_Phieu_thue(Ds, dk = {}) {
    const Ho_ten = this.Chuyen_chu_thuong(dk.Ho_ten || "");
    return Ds.filter((pt) => {
      if (dk.Ma_phieu && pt.Ma_phieu !== dk.Ma_phieu) return false;
      if (dk.So_phong && pt.So_phong !== dk.So_phong) return false;
      if (dk.Loai_phong && pt.Loai_phong !== dk.Loai_phong) return false;
      if (
        Ho_ten &&
        !(pt.Danh_sach_khach || []).some((k) =>
          this.Chuyen_chu_thuong(k.Ho_ten || "").includes(Ho_ten)
        )
      )
        return false;
      if (
        dk.Tu_ngay &&
        dk.Den_ngay &&
        !this.Trung_Thoi_Gian(
          pt.Ngay_nhan,
          pt.Ngay_tra,
          dk.Tu_ngay,
          dk.Den_ngay
        )
      )
        return false;
      return true;
    });
  }
  Xu_ly_Tra_cuu_Phieu_thue(ds, f = {}) {
    // Ưu tiên Mã phiếu
    if (f.Ma_phieu)
    {
      const key = String(f.Ma_phieu).trim().toUpperCase();
      return ds.filter(p => String(p.Ma_phieu || "").toUpperCase() === key);
    }
    const U = (s) => String(s || "").toUpperCase();

    // Nếu có khu vực: chấp nhận các kiểu KV_A, "A", "Khu A"… → ký tự khu (A/B/C)
    const pickKV = (kv) => {
      const s = U(kv);
      const m1 = s.match(/^KV[\s_\-]?([A-Z]|\d+)$/);     // KV_A, KV-1
      if (m1) return String(m1[1]).replace(/\D/g, '') ? String.fromCharCode(64 + (+m1[1])) : m1[1];
      const m2 = s.match(/([A-Z])$/);                    // ...A
      return m2 ? m2[1] : "";
    };
    const needKV = f.Khu_vuc ? pickKV(f.Khu_vuc) : "";

    const trongKhoang = (d, tu, den) => {
      if (!tu && !den) return true;
      const x = new Date(d);
      return (!tu || x >= new Date(tu)) && (!den || x <= new Date(den));
    };

    return ds.filter(p => {
      if (needKV)
      {
        const kvPhong = U(p.So_phong || p.Phong || "").charAt(0); // A-0101 -> A
        if (kvPhong !== needKV) return false;
      }
      if (f.So_phong && U(p.So_phong || p.Phong) !== U(f.So_phong)) return false;
      if (f.Ho_ten)
      {
        const has = (p.Danh_sach_khach || []).some(k => U(k.Ho_ten).includes(U(f.Ho_ten)));
        if (!has) return false;
      }
      if (f.Loai_phong)
      {
        const wantId = this.Chuan_hoa_Ma(f.Loai_phong);
        const pid = this.Chuan_hoa_Ma(p.Loai_phong);
        if (Number.isFinite(wantId) && Number.isFinite(pid))
        {
          if (pid !== wantId) return false;
        } else
        {
          const sel = U(f.Loai_phong).replace(/\s+/g, "");
          const pp = U(p.Loai_phong).replace(/\s+/g, "");
          if (!(pp === sel || pp.includes(sel))) return false;
        }
      }
      if (f.Tu_ngay || f.Den_ngay)
      {
        const tu = f.Tu_ngay ? new Date(f.Tu_ngay) : null;
        const den = f.Den_ngay ? new Date(f.Den_ngay) : null;
        const den_ex = den ? new Date(den.getFullYear(), den.getMonth(), den.getDate() + 1) : null;
        const b1 = tu ? tu : new Date(p.Ngay_nhan);
        const b2 = den_ex ? den_ex : new Date(p.Ngay_tra);
        if (!this.Trung_Thoi_Gian(p.Ngay_nhan, p.Ngay_tra, b1, b2)) return false;
      }
      return true;
    });
  }

  Xu_ly_Lap_Phieu(Phieu) {
    const So_phong = Phieu.So_phong;
    const Tu = this.Chuan_Hoa_Ngay(Phieu.Ngay_nhan);
    const Den = this.Chuan_Hoa_Ngay(Phieu.Ngay_tra);
    const Ds = this.Doc_Danh_sach_Phieu_thue();
    if (this.Kiem_tra_Chong_lan(Ds, So_phong, Tu, Den))
      throw new Error("Phòng đã có phiếu trong thời gian này");
    for (const k of Phieu.Danh_sach_khach || [])
    {
      if (!this.CCCD_Hop_le(k.CCCD))
        throw new Error(`CCCD không hợp lệ: ${k.CCCD}`);
      if (this.CCCD_Da_ton_tai(k.CCCD))
        throw new Error(`CCCD đã tồn tại: ${k.CCCD}`);
    }
    const Loai_obj = this.Doc_Danh_muc_Loai_phong().find(
      (x) => x.Ten === Phieu.Loai_phong || x.Ma_so === Phieu.Loai_phong
    );
    const Tien = this.Tinh_Tien_Phong_Theo_Don_Gia_Lich_su(Phieu, Loai_obj);
    this.Ghi_Phieu_thue(Phieu);
    return { Thanh_cong: true, Tien_thue: Tien };
  }
  Lay_Ma_Phieu_thue_Lon_nhat() {
    // quét thư mục Phieu_thue để tìm max số PT_xxxx đang còn
    try
    {
      const files = FS.readdirSync(Thu_muc_Phieu_thue).filter((f) =>
        /^PT_\d{4}\.json$/i.test(f)
      );
      let max = 0;
      files.forEach((f) => {
        const n = +f.match(/^PT_(\d{4})/i)[1];
        if (n > max) max = n;
      });
      return max;
    } catch
    {
      return 0;
    }
  }
  Lay_Ma_Phieu_thue_Tiep_theo() {
    const c = this.Doc_Counter_Phieu();
    const maxOnDisk = this.Lay_Ma_Phieu_thue_Lon_nhat();
    const next = Math.max(Number(c.last || 0), maxOnDisk) + 1;
    const code = `PT_${String(next).padStart(4, "0")}`;
    this.Ghi_Counter_Phieu({ last: next });
    return code;
  }
  Xu_ly_Sua_Phieu(Phieu) {
    const Ma = String(Phieu?.Ma_phieu || "").trim();
    const Goc = this.Doc_Phieu_thue(Ma);
    if (!Goc) return { Loi: `Không tìm thấy phiếu ${Ma}` };

    // KHÓA loại phòng: không cho đổi so với bản gốc
    Phieu.Loai_phong = Goc.Loai_phong;

    // Kiểm tra chồng lấn thời gian (bỏ qua chính phiếu đang sửa)
    const Ds = this.Doc_Danh_sach_Phieu_thue();
    if (
      this.Kiem_tra_Chong_lan_Except(
        Ds,
        Ma,
        Phieu.So_phong,
        Phieu.Ngay_nhan,
        Phieu.Ngay_tra
      )
    )
      return { Loi: "Trùng thời gian với phiếu khác" };

    // Validate khách: CCCD hợp lệ & không trùng (trừ chính phiếu này)
    for (const k of Phieu.Danh_sach_khach || [])
    {
      if (!this.CCCD_Hop_le(k.CCCD))
        return { Loi: `CCCD không hợp lệ: ${k.CCCD}` };
      if (this.CCCD_Da_ton_tai_Except(k.CCCD, Ma))
        return { Loi: `CCCD đã tồn tại: ${k.CCCD}` };
    }

    // Kiểm tra SỨC CHỨA theo loại phòng
    const dm = this.Doc_Danh_muc_Loai_phong() || [];
    const Loai_obj = dm.find(
      (x) =>
        String(x.Ten || "").toUpperCase() ===
        String(Phieu.Loai_phong || "").toUpperCase() ||
        String(x.Ma_so || "").toUpperCase() ===
        String(Phieu.Loai_phong || "").toUpperCase()
    );
    const suc_chua = Number(Loai_obj?.Suc_chua || Loai_obj?.Suc_chứa || 0) || 0;
    const so_khach = Number(Phieu.So_khach || 0);
    if (suc_chua && so_khach > suc_chua)
      return {
        Loi: `Số khách (${so_khach}) vượt sức chứa của loại phòng (${suc_chua}).`,
      };

    // Tính tiền thuê theo lịch sử đơn giá
    const Tien = this.Tinh_Tien_Phong_Theo_Don_Gia_Lich_su(Phieu, Loai_obj);

    // Cập nhật
    this.Ghi_Phieu_thue(Phieu);

    return { Thanh_cong: true, Tien_thue: Tien };
  }
  CCCD_Hop_le(CCCD) {
    return /^(030|031)\d{9}$/.test(CCCD);
  }
  CCCD_Da_ton_tai(CCCD) {
    const ds = this.Doc_Danh_sach_Phieu_thue();
    for (const pt of ds)
      for (const k of pt.Danh_sach_khach || [])
        if (k.CCCD === CCCD) return true;
    return false;
  }
  CCCD_Da_ton_tai_Except(CCCD, Ma_phieu) {
    const ds = this.Doc_Danh_sach_Phieu_thue();
    for (const pt of ds)
    {
      if (pt.Ma_phieu === Ma_phieu) continue;
      for (const k of pt.Danh_sach_khach || [])
        if (k.CCCD === CCCD) return true;
    }
    return false;
  }

  // ---Lập báo cáo và thay đổi Đơn giá hiện tại ---
  Lap_Bao_cao_Thu_Thang(Nam, Thang) {
    const ds = this.Doc_Danh_sach_Phieu_thue();
    const DM = this.Doc_Danh_muc_Loai_phong();
    const Gia = Object.fromEntries(DM.map((x) => [x.Ten, +x.Don_gia]));
    const Bang = {};
    let Tong = 0;
    for (const pt of ds)
    {
      const d = new Date(pt.Ngay_nhan);
      if (d.getFullYear() === +Nam && d.getMonth() + 1 === +Thang)
      {
        const so_ngay = this.Tinh_So_ngay(pt.Ngay_nhan, pt.Ngay_tra);
        const t = so_ngay * (Gia[pt.Loai_phong] || 0);
        Bang[pt.Loai_phong] = (Bang[pt.Loai_phong] || 0) + t;
        Tong += t;
      }
    }
    const Chi_tiet = Object.keys(Bang).map((k) => ({
      Loai_phong: k,
      Thu: Bang[k],
      Ty_le: Tong ? +((Bang[k] * 100) / Tong).toFixed(2) : 0,
    }));
    return { Nam, Thang, Tong_thu: Tong, Chi_tiet };
  }
  Lap_Bao_cao_Thu_Nam(Nam) {
    const Chi_tiet = [];
    for (let t = 1; t <= 12; t++)
    {
      const bc = this.Lap_Bao_cao_Thu_Thang(Nam, t);
      Chi_tiet.push({ Thang: t, Thu: bc.Tong_thu });
    }
    const Tong = Chi_tiet.reduce((a, b) => a + b.Thu, 0);
    Chi_tiet.forEach(
      (h) => (h.Ty_le = Tong ? +((h.Thu * 100) / Tong).toFixed(2) : 0)
    );
    return { Nam, Tong_thu: Tong, Chi_tiet };
  }
  Lay_Thang_Nam_Hien_tai() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }
  Lay_Quy_hien_tai(dateISO) {
    // trả [y, q]
    const d = dateISO ? new Date(dateISO) : new Date();
    const y = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return [y, q];
  }
  Lay_Khoang_Ngay_nhan_tra_Phong(nhanISO, traISO) {
    // [nhận, trả) end-exclusive
    const out = [];
    let d = new Date(nhanISO);
    d.setHours(0, 0, 0, 0);
    const end = new Date(traISO);
    end.setHours(0, 0, 0, 0);
    while (d < end)
    {
      out.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  Tu_Thang_01_2022_Den_Thang_truoc() {
    const { y: cy, m: cm } = this.Lay_Thang_Nam_Hien_tai();
    const stopY = cm === 1 ? cy - 1 : cy;
    const stopM = cm === 1 ? 12 : cm - 1;
    const opts = [];
    for (let y = 2022; y <= stopY; y++)
    {
      const mStart = y === 2022 ? 1 : 1;
      const mEnd = y === stopY ? stopM : 12;
      for (let m = mStart; m <= mEnd; m++)
      {
        const mm = String(m).padStart(2, "0");
        opts.push(`<option value="${y}-${mm}">${mm}/${y}</option>`);
      }
    }
    return opts.join("");
  }
  Tu_Nam_2022_Den_Nam_truoc() {
    const { y: cy } = this.Lay_Thang_Nam_Hien_tai();
    const stop = cy - 1;
    const opts = [];
    for (let y = 2022; y <= stop; y++)
      opts.push(`<option value="${y}">${y}</option>`);
    return opts.join("");
  }
  Tu_Ngay_Bat_dau_den_Ket_thuc_Quy(nam, quy) {
    let y = Number(nam),
      q = Number(quy);
    if (!Number.isFinite(y) || ![1, 2, 3, 4].includes(q))
    {
      const now = new Date();
      y = now.getFullYear();
      q = this.Lay_Quy_hien_tai
        ? this.Lay_Quy_hien_tai(now)
        : Math.ceil((now.getMonth() + 1) / 3);
    }
    const start = new Date(y, (q - 1) * 3, 1);
    const end = new Date(y, q * 3, 0);
    return {
      tu: this.Lay_Ngay_ko_lay_Gio(start),
      den: this.Lay_Ngay_ko_lay_Gio(end),
      y,
      q,
    };
  }
  Tu_QuyI_2022_den_nay(fromYear = 2022) {
    const [cy, cq] = this.Lay_Quy_hien_tai();
    const out = [];
    for (let y = fromYear; y <= cy; y++)
    {
      for (let q = 1; q <= 4; q++)
      {
        if (y === cy && q > cq) break;
        const r = this.Tu_Ngay_Bat_dau_den_Ket_thuc_Quy(y, q);
        out.push({ label: `Q${q}/${y}`, y, q, tu: r.tu, den: r.den });
      }
    }
    return out.reverse(); // quý mới nhất đầu danh sách
  }
  Tra_cuu_Don_gia(Bo_loc) {
    // Khoang
    if (Bo_loc && (Bo_loc.Tu_ngay || Bo_loc.Den_ngay))
    {
      const tu = Bo_loc.Tu_ngay
        ? new Date(Bo_loc.Tu_ngay)
        : this.Bat_dau_Thang_nay();
      const den = Bo_loc.Den_ngay
        ? new Date(Bo_loc.Den_ngay)
        : this.Bat_dau_Thang_sau();
      return this.Doc_Lich_su_Don_gia(tu, den);
    }
    // Theo Quy
    if (Bo_loc && Bo_loc.Quy && Bo_loc.Nam)
    {
      return this.Don_gia_Theo_Quy(Bo_loc.Quy, Bo_loc.Nam);
    }
    // Hien tai (mac dinh)
    const hom_nay = this.Bat_dau_Hom_Nay();
    return this.Doc_Lich_su_Don_gia(hom_nay, this.Cong_Ngay(hom_nay, 1));
  }
  Don_gia_Theo_Ngay(loaiId, ngayISO) {
    const ds = this.Doc_Lich_su_Don_gia().filter((x) => +x.loai_id === +loaiId);
    if (!ds.length)
    {
      const lo = (this.Doc_Danh_muc_Loai_phong() || []).find(
        (l) => +l.id === +loaiId
      );
      return lo ? +lo.gia || 0 : 0;
    }
    const rec = ds.find(
      (x) =>
        x.hieu_luc_tu <= ngayISO &&
        (!x.hieu_luc_den || ngayISO <= x.hieu_luc_den)
    );
    return rec ? +rec.gia || 0 : 0;
  }
  Don_gia_Theo_Quy(y, q) {
    const { tu, den } = this.Tu_Ngay_Bat_dau_den_Ket_thuc_Quy(y, q);
    const ds = this.Doc_Lich_su_Don_gia();
    const pick = (lid) => {
      return (
        ds
          .filter(
            (x) =>
              +x.loai_id === +lid &&
              !(x.hieu_luc_den && x.hieu_luc_den < tu) &&
              !(den < x.hieu_luc_tu)
          )
          .sort((a, b) =>
            (b.hieu_luc_tu || "").localeCompare(a.hieu_luc_tu || "")
          )[0] || null
      );
    };
    return [1, 2, 3].map((lid) => ({ loai_id: lid, rec: pick(lid) }));
  }
  Cong_Ngay(Ngay, So_ngay = 0) {
    const d = new Date(Ngay);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Number(So_ngay || 0));
    return d;
  }
  Tinh_Tien_Phong_Theo_Don_Gia_Lich_su(Phieu) {
    if (!Phieu || !Phieu.Ngay_nhan || !Phieu.Ngay_tra) return 0;
    const loaiId = this.Chuan_hoa_Ma(Phieu.Loai_phong);
    if (!Number.isFinite(loaiId)) return 0;
    const days = this.Lay_Khoang_Ngay_nhan_tra_Phong(
      Phieu.Ngay_nhan,
      Phieu.Ngay_tra
    ); // các đêm
    let sum = 0;
    for (const d of days) sum += Number(this.Don_gia_Theo_Ngay(loaiId, d) || 0);
    return sum;
  }

  Chuan_hoa_Ma(Loai) {
    // Chuẩn hoá về số 1/2/3 cho mọi đầu vào: "LP_2", "Deluxe", 2, "2", ...
    if (typeof Loai === "number" && Number.isFinite(Loai)) return +Loai;

    const nRaw = String(Loai || "").trim();
    const n = nRaw.toUpperCase();

    // 1) Dạng mã: LP_1 / LP-1 / LP1
    const m = n.match(/^LP[\s_\-]?(\d+)$/i);
    if (m) return +m[1];

    // 2) Dạng số thuần
    if (/^\d+$/.test(n)) return +n;

    // 3) Dạng tên
    if (n.includes("STANDARD")) return 1;
    if (n.includes("DELUXE")) return 2;
    if (n.includes("SUITE")) return 3;

    // 4) Tra theo danh mục (Ma_so hoặc Ten)
    try
    {
      const dm = this.Doc_Danh_muc_Loai_phong() || [];
      const found = dm.find(
        (x) =>
          String(x.Ma_so || "").toUpperCase() === n ||
          String(x.Ten || "").toUpperCase() === n
      );
      if (found)
      {
        // ưu tiên lấy số từ Ma_so ("LP_2" → 2)
        const mm = String(found.Ma_so || "")
          .toUpperCase()
          .match(/^LP[\s_\-]?(\d+)$/);
        if (mm) return +mm[1];
        // hoặc map theo tên
        const t = String(found.Ten || "").toUpperCase();
        if (t.includes("STANDARD")) return 1;
        if (t.includes("DELUXE")) return 2;
        if (t.includes("SUITE")) return 3;
      }
    } catch { }

    return NaN;
  }
  Lay_Ngay_ko_lay_Gio(d) {
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d.getTime())) return "";
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  Bat_dau_Hom_Nay(Ngay = new Date()) {
    const d = new Date(Ngay);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  Bat_dau_Thang_nay(Ngay = new Date()) {
    const d = new Date(Ngay);
    const r = new Date(d.getFullYear(), d.getMonth(), 1);
    r.setHours(0, 0, 0, 0);
    return r;
  }
  Bat_dau_Thang_sau(Ngay = new Date()) {
    const d = new Date(Ngay);
    const r = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  Dinh_dang_Ngay_VN(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    return `${d}/${m}/${y}`;
  }
  Dinh_dang_VND(n) {
    return (+n || 0).toLocaleString("vi-VN");
  }
  Cap_nhat_Don_gia_Quy(param) {
    const y = Number(param?.y), q = Number(param?.q);
    const gia1 = Number(param?.gia1 || 0), gia2 = Number(param?.gia2 || 0), gia3 = Number(param?.gia3 || 0);
    if (!Number.isInteger(y) || !Number.isInteger(q)) throw new Error("Thiếu hoặc sai Quý/Năm");
    if (gia1 <= 0 || gia2 <= 0 || gia3 <= 0) throw new Error("Giá phải > 0");
    if (!(gia1 < gia2 && gia2 < gia3)) throw new Error("Standard < Deluxe < Suite");

    const { tu, den } = this.Tu_Ngay_Bat_dau_den_Ket_thuc_Quy(y, q);

    // Đọc lịch sử giá
    let ds = this.Doc_Lich_su_Don_gia() || [];

    const nextVersion = (loaiId) => {
      let v = 0;
      for (const x of ds) if (+x.loai_id === +loaiId) v = Math.max(v, Number(x.version || 0));
      return v + 1;
    };

    const upsert = (loaiId, gia) => {
      // Nếu đã có đúng khoảng hiệu lực -> cập nhật giá, giữ version
      const exist = ds.find(x => +x.loai_id === +loaiId && x.hieu_luc_tu === tu && x.hieu_luc_den === den);
      if (exist) { exist.gia = Number(gia) || 0; return; }
      // Nếu chưa có -> thêm bản ghi mới
      ds.push({ loai_id: loaiId, version: nextVersion(loaiId), gia: Number(gia) || 0, hieu_luc_tu: tu, hieu_luc_den: den });
    };

    upsert(1, gia1);   // Standard
    upsert(2, gia2);   // Deluxe
    upsert(3, gia3);   // Suite

    // Sắp xếp để dễ theo dõi
    ds.sort((a, b) => (a.hieu_luc_tu || '').localeCompare(b.hieu_luc_tu || '')
      || (a.loai_id || 0) - (b.loai_id || 0)
      || (a.version || 0) - (b.version || 0));

    // Ghi atomically
    this.Ghi_JSON_Atomic(Tep_Gia_lich_su, ds);
    return true;
  }


  // === XỬ LÝ THỂ HIỆN ===
  Tao_Chuoi_HTML_Thong_bao(msg) {
    return `<div class='alert alert-info'>${msg}</div>`;
  }
  Tao_Chuoi_HTML_Tra_cuu_Phong(ctx = {}) {
    const KS = this.Doc_Khach_san();
    const ds_kv = (KS.Danh_sach_Khu_vuc || []).map((k) => ({
      Ma_so: k.Ma_so,
      Ten: k.Ten,
    }));
    const ds_tang = (KS.Danh_sach_Tang || []).map((t) => ({
      Ma_so: t.Ma_so,
      Ten: t.Ten,
    }));
    const ds_loai = this.Doc_Danh_muc_Loai_phong() || [];

    const Hom_nay = new Date();
    const Ngay_sau = new Date(Hom_nay.getTime() + 24 * 3600 * 1000);
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    return `
    <div class="container py-3">
      <h5 class="mb-3">Tra cứu phòng trống</h5>
  
      <form method="post" action="/Tra_cuu_Phong_trong" class="row g-3">
        <!-- Hàng 1: Ngày + nút -->
        <div class="col-md-3">
          <label class="form-label d-block">Từ ngày</label>
          <input name="Tu_ngay" type="date" class="form-control" value="${fmt(Hom_nay)}" required>
        </div>
        <div class="col-md-3">
          <label class="form-label d-block">Đến ngày</label>
          <input name="Den_ngay" type="date" class="form-control" value="${fmt(Ngay_sau)}" required>
        </div>
  
        <!-- Ngắt dòng rõ ràng -->
        <div class="col-12"><hr class="my-2"></div>
  
        <!-- Hàng 2: Khu / Loại phòng / Tầng -->
        <div class="col-md-3">
          <label class="form-label d-block">Khu vực</label>
          <select name="Khu_vuc" class="form-select">
            <option value="">-- Tất cả --</option>
            ${ds_kv
        .map((k) => `<option value="${k.Ma_so}">${k.Ten}</option>`)
        .join("")}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label d-block">Loại phòng</label>
          <select name="Loai_phong" class="form-select">
            <option value="">-- Tất cả --</option>
            ${ds_loai
        .map(
          (l) =>
            `<option value="${l.Ma_so}">${l.Ten} – ${l.Suc_chua
            } khách – ${(+l.Don_gia || 0).toLocaleString()} đ</option>`
        )
        .join("")}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label d-block">Tầng</label>
          <select name="Tang" class="form-select">
            <option value="">-- Tất cả --</option>
            ${ds_tang
        .map((t) => `<option value="${t.Ma_so}">${t.Ten}</option>`)
        .join("")}
          </select>
        </div>
        <!-- Ngắt dòng rõ ràng -->
        <div class="col-12"><hr class="my-2"></div>
                <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-primary w-100">Tìm phòng</button>
        </div>
      </form>
    </div>`;
  }
  Tao_Chuoi_HTML_Danh_sach_Phong_trong(Ds, ctx = {}) {
    const { Tu_ngay, Den_ngay } = ctx;
    const hang = (p) => `
      <tr>
        <td>${p.So_phong}</td><td>${p.Khu_vuc}</td><td>${p.Tang}</td>
        <td>${p.Ten_loai}</td><td>${p.Suc_chua
      }</td><td>${p.Gia.toLocaleString()}</td>
        <td>
          <form method="post" action="/Chon_Lap_Phieu" onsubmit="return confirm('Bạn đã đặt Phòng ${p.So_phong
      } từ ${Tu_ngay} đến ${Den_ngay}. Thông tin đặt phòng sẽ gửi qua email cho bạn sớm nhất!')">
            <input type="hidden" name="So_phong" value="${p.So_phong}">
            <input type="hidden" name="Tu_ngay" value="${Tu_ngay}">
            <input type="hidden" name="Den_ngay" value="${Den_ngay}">
            <button class="btn btn-sm btn-success">Chọn</button>
          </form>
        </td>
      </tr>`;
    return `
    <div class="container">
      <h6>Danh sách phòng trống (${Ds.length})</h6>
      <table class="table table-sm table-striped align-middle">
        <thead><tr>
          <th>Phòng</th><th>Khu</th><th>Tầng</th><th>Loại phòng</th><th>Sức chứa</th><th>Giá (đ)</th><th></th>
        </tr></thead>
        <tbody>${Ds.map(hang).join("")}</tbody>
      </table>
    </div>`;
  }
  Tao_Chuoi_HTML_Lap_Phieu(Gia_tri = {}) {
    const val = (k, d = "") => (Gia_tri && Gia_tri[k] != null ? Gia_tri[k] : d);
    const Hom_nay = new Date();
    const Ngay_sau = new Date(Hom_nay.getTime() + 24 * 3600 * 1000);
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    return `
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="mb-3">Lập phiếu thuê</h5>
  
          <form method="post" action="/Lap_Phieu" id="FrmLapPhieu" class="row g-3">
            <!-- Khoảng thời gian -->
            <div class="col-md-3">
              <label class="form-label">Từ ngày</label>
              <input id="Th_Tu_ngay" name="Tu_ngay" type="date" class="form-control" required
                     value="${val('Tu_ngay', fmt(Hom_nay))}">
            </div>
            <div class="col-md-3">
              <label class="form-label">Đến ngày</label>
              <input id="Th_Den_ngay" name="Den_ngay" type="date" class="form-control" required
                     value="${val('Den_ngay', fmt(Ngay_sau))}">
            </div>
  
            <!-- Chọn phòng: chỉ 1 combobox phòng trống -->
            <div class="col-md-4">
              <label class="form-label">Phòng trống *</label>
              <select id="Th_So_phong" name="So_phong" class="form-select" required disabled>
                <option value="">-- Chọn phòng trống --</option>
              </select>
              <small class="text-muted">Chỉ hiển thị phòng trống theo khoảng ngày.</small>
            </div>
  
            <div class="col-md-2">
              <label class="form-label">Số khách</label>
              <input id="Th_So_khach" name="So_khach" type="number" min="1"
                     value="${val('So_khach', 1)}" class="form-control">
              <small id="LblSucChua" class="text-muted">Sức chứa tối đa: –</small>
            </div>
  
            <!-- Hidden để submit loại phòng (không để bên trong <select>) -->
            <input type="hidden" id="Th_Loai_phong" name="Loai_phong" value="${val('Loai_phong', '')}">
  
            <div class="col-12"><hr></div>
  
            <!-- Thông tin khách -->
            <div class="col-12">
              <label class="form-label">Thông tin khách (ít nhất 1 khách có Tên & CCCD)</label>
              <div class="row g-2">
                ${[1, 2, 3, 4].map(i => `
                  <div class="col-md-4">
                    <input class="form-control" name="Ho_ten_KH${i}" placeholder="Họ tên KH${i}" value="${val('Ho_ten_KH' + i, '')}">
                  </div>
                  <div class="col-md-4">
                    <input class="form-control" name="CCCD_KH${i}" placeholder="CCCD (030/031..., 12 số)" value="${val('CCCD_KH' + i, '')}">
                  </div>
                  <div class="col-md-4">
                    <input class="form-control" name="Dien_thoai_KH${i}" placeholder="Điện thoại (không bắt buộc)" value="${val('Dien_thoai_KH' + i, '')}">
                  </div>
                `).join('')}
              </div>
            </div>
  
            <div class="col-12 mt-2">
              <button class="btn btn-success">Ghi phiếu</button>
            </div>
          </form>
        </div>
      </div>
  
      <script>
      (function(){
        const frm        = document.getElementById('FrmLapPhieu');
        const inpTu      = document.getElementById('Th_Tu_ngay');
        const inpDen     = document.getElementById('Th_Den_ngay');
        const cboPhong   = document.getElementById('Th_So_phong');
        const inpSoKhach = document.getElementById('Th_So_khach');
        const lblSucChua = document.getElementById('LblSucChua');
        const hidLoai    = document.getElementById('Th_Loai_phong');
  
        // Chuẩn ISO yyyy-mm-dd theo local TZ (tránh lệch múi giờ)
        const ISO = (d) => { try{ const x=new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10);}catch{ return "";} };
        const FmtVND = (n)=> (Number(n||0)).toLocaleString('vi-VN');
  
        // Đặt mặc định: hôm nay & ngày mai nếu trống
        (function setDefaultDates(){
          if (!inpTu.value || !inpDen.value){
            const today    = new Date();
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
            if (!inpTu.value)  inpTu.value  = ISO(today);
            if (!inpDen.value) inpDen.value = ISO(tomorrow);
          }
        })();
  
        function khoaCombo(dis=true, msg="-- Chọn phòng trống --"){
          cboPhong.disabled = dis;
          cboPhong.innerHTML = '<option value="">'+msg+'</option>';
          lblSucChua.textContent = 'Sức chứa tối đa: –';
          inpSoKhach.max = '';
        }
  
        async function napPhongTrong(){
          const tu  = ISO(inpTu.value);
          const den = ISO(inpDen.value);
          if (!tu || !den || tu >= den){ khoaCombo(true); return; }
  
          try{
            const rs = await fetch('/Ajax_Danh_sach_Phong_trong',{
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ Tu_ngay: tu, Den_ngay: den })
            });
            const data = await rs.json();
            const ds = Array.isArray(data) ? data : (data.Danh_sach || []);
            if (!ds.length){ khoaCombo(true, '— Không còn phòng trống —'); return; }
  
            const opts = ['<option value="">-- Chọn phòng trống --</option>']
              .concat(ds.map(function(p){
                var loai   = p.Ten_loai || p.Loai_phong || '';
                var suc    = p.Suc_chua || '';
                var giaNum = (p.Gia != null) ? p.Gia : (p.Don_gia_hien_tai || 0);
                var giaTxt = giaNum ? (FmtVND(giaNum)+'đ') : '';
                var label  = (p.So_phong||'')+' - '+loai+' - '+suc+' KH - '+giaTxt;
  
                return '<option value="'+(p.So_phong||'')+'"'
                     + ' data-succhua="'+suc+'"'
                     + ' data-loai="'+loai+'"'
                     + ' data-gia="'+giaNum+'">'+label+'</option>';
              }));
  
            cboPhong.innerHTML = opts.join('');
            cboPhong.disabled = false;
  
            // Khôi phục lựa chọn cũ (nếu có)
            const old = '${val('So_phong', '')}';
            if (old){
              const op = Array.from(cboPhong.options).find(o => o.value === old);
              if (op){ op.selected = true; cboPhong.dispatchEvent(new Event('change')); }
            }
          }catch(e){
            console.error(e);
            khoaCombo(true, '— Lỗi tải danh sách —');
            alert('Không tải được danh sách phòng trống.');
          }
        }
  
        cboPhong.addEventListener('change', function(){
          const op  = cboPhong.selectedOptions[0];
          const max = Number(op?.dataset?.succhua || 0) || '';
          const loai= op?.dataset?.loai || '';
          hidLoai.value = loai;
          inpSoKhach.max = max || '';
          if (max){
            if (Number(inpSoKhach.value||1) > max) inpSoKhach.value = max;
            lblSucChua.textContent = 'Sức chứa tối đa: ' + max;
          } else {
            lblSucChua.textContent = 'Sức chứa tối đa: –';
          }
        });
  
        // Kiểm tra trước khi submit: cần 1 khách hợp lệ + đã chọn phòng
        frm.addEventListener('submit', function(e){
          const ok = [1,2,3,4].some(i=>{
            const ten  = (frm['Ho_ten_KH'+i]?.value || '').trim();
            const cccd = (frm['CCCD_KH'+i]?.value || '').trim();
            return ten && /^0(30|31)\\d{9}$/.test(cccd);
          });
          if (!ok){ e.preventDefault(); alert('Cần ít nhất 1 khách có Họ tên và CCCD hợp lệ.'); return; }
          if (!cboPhong.value){ e.preventDefault(); alert('Vui lòng chọn Phòng trống.'); return; }
        });
  
        // Nạp danh sách phòng trống khi trang mở/đổi ngày
        napPhongTrong();
        inpTu.addEventListener('change', napPhongTrong);
        inpDen.addEventListener('change', napPhongTrong);
      })();
      </script>
    `;
  }

  Tao_Chuoi_HTML_Tra_cuu_Phieu(user, filter = {}, ds_ket_qua = []) {
    const ds_loai = this.Doc_Danh_muc_Loai_phong() || [];
    const KS = this.Doc_Khach_san() || {};
    const ds_kv = (KS.Danh_sach_Khu_vuc || []).map(k => ({ Ma_so: k.Ma_so, Ten: k.Ten }));

    const val = (k) => (filter && filter[k] ? filter[k] : "");
    const curLoai = val("Loai_phong");
    const curKV = val("Khu_vuc");

    const isTT = (user?.Vai_tro === "Tiep_tan");
    const kvLock = isTT ? (user?.Khu_vuc || curKV || "") : curKV;

    const optKV = ['<option value="">-- Tất cả --</option>']
      .concat(ds_kv.map(k => {
        const sel = String(k.Ma_so || "") === String(kvLock || "");
        return `<option value="${k.Ma_so}" ${sel ? "selected" : ""}>${k.Ten}</option>`;
      })).join("");

    const optLoai = ['<option value="">-- Tất cả --</option>']
      .concat(ds_loai.map(l => {
        const v = String(curLoai || "").toUpperCase();
        const ms = String(l.Ma_so || "").toUpperCase();
        const ten = String(l.Ten || "").toUpperCase();
        const ok = v && (v === ms || v === ten || this.Chuan_hoa_Ma(v) === this.Chuan_hoa_Ma(ms) || this.Chuan_hoa_Ma(v) === this.Chuan_hoa_Ma(ten));
        return `<option value="${l.Ma_so}" ${ok ? "selected" : ""}>${l.Ten} – ${(+(l.Don_gia || l.gia || 0)).toLocaleString("vi-VN")}₫</option>`;
      })).join("");

    const submitted = !!(filter && filter.__submitted);
    const _now = new Date(); _now.setHours(0, 0, 0, 0);
    const _tom = new Date(_now); _tom.setDate(_tom.getDate() + 1);
    const _fmtISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Khu vực (disabled + hidden khi là Tiếp tân)
    const fieldKV = isTT
      ? `<select class="form-select" disabled>${optKV}</select><input type="hidden" name="Khu_vuc" value="${kvLock}"/>`
      : `<select name="Khu_vuc" class="form-select">${optKV}</select>`;

    return `
      <div class="container">
        <div class="row">
          <!-- FORM BÊN TRÁI -->
          <div class="col-md-4">
            <form method="post" action="/Tra_cuu_Phieu" class="row g-3 p-3 border rounded bg-light">
              <h5 class="mb-2">Tra cứu</h5>
  
              <div class="col-12">
                <label>Mã phiếu:</label>
                <input name="Ma_phieu" value="${val("Ma_phieu")}" class="form-control" placeholder="VD: PT_1137"/>
                <small class="text-muted">Nếu nhập Mã phiếu, các tiêu chí khác sẽ bỏ qua.</small>
              </div>
  
              <div class="col-12">
                <label>Số phòng:</label>
                <input name="So_phong" value="${val("So_phong")}" class="form-control" placeholder="A-101"/>
              </div>
  
              <div class="col-12">
                <label>Tên khách:</label>
                <input name="Ho_ten" value="${val("Ho_ten")}" class="form-control" placeholder="Nguyễn Văn A"/>
              </div>
  
              <div class="col-12">
                <label>Khu vực:</label>
                ${fieldKV}
              </div>
  
              <div class="col-12">
                <label>Loại phòng:</label>
                <select name="Loai_phong" class="form-select">${optLoai}</select>
              </div>
  
              <div class="col-6">
                <label>Từ ngày:</label>
                <input type="date" name="Tu_ngay" value="${val("Tu_ngay") || _fmtISO(_now)}" class="form-control"/>
              </div>
              <div class="col-6">
                <label>Đến ngày:</label>
                <input type="date" name="Den_ngay" value="${val("Den_ngay") || _fmtISO(_tom)}" class="form-control"/>
              </div>
  
              <input type="hidden" name="__submitted" value="1"/>
              <div class="col-12">
                <button class="btn btn-primary w-100" style="margin-top:10px;">🔍 Tra cứu</button>
              </div>
            </form>
          </div>
  
          <!-- KẾT QUẢ BÊN PHẢI -->
          <div class="col-md-8">
            ${submitted ? this.Tao_Chuoi_HTML_Tra_cuu_KQ(ds_ket_qua) : ""}
          </div>
        </div>
      </div>`;
  }

  Tao_Chuoi_HTML_Tra_cuu_KQ(ds) {
    if (!ds || !ds.length)
      return `<p class="text-muted">Không tìm thấy kết quả.</p>`;

    const items = ds
      .map((p, i) => {
        const collapseId = `collapse_khach_${i}`;
        const kh =
          (p.Danh_sach_khach || [])
            .map(
              (k) =>
                `<li>${k.Ho_ten || ""} – CMND/CCCD: ${k.CMND || k.CCCD || ""
                }</li>`
            )
            .join("") || "<li><em>Không có khách</em></li>";

        // Tính tiền thuê: ưu tiên theo lịch sử đơn giá nếu có
        const tien = this.Tinh_Tien_Phong_Theo_Don_Gia_Lich_su
          ? this.Tinh_Tien_Phong_Theo_Don_Gia_Lich_su(p)
          : this.Tinh_Tien_Phieu
            ? this.Tinh_Tien_Phieu(p)
            : 0;

        const loai = p.Loai_phong ? ` – ${p.Loai_phong}` : "";
        const soPhong = p.So_phong || p.Phong || "";

        return `
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm" style="cursor:pointer;"
             onclick="document.getElementById('${collapseId}').classList.toggle('d-none')">
          <div class="card-body">
            <h5 class="card-title">Phòng ${soPhong}${loai}</h5>
            <p class="card-text"><strong>Thời gian:</strong> ${p.Ngay_nhan} → ${p.Ngay_tra
          }</p>
            <p class="card-text"><strong>Tiền thuê:</strong> ${Number(
            tien
          ).toLocaleString("vi-VN")}₫</p>
            <div id="${collapseId}" class="collapse-khach border rounded p-2 mt-2 d-none bg-light">
              <strong>Thông tin khách:</strong>
              <ul class="mb-0">${kh}</ul>
            </div>
          </div>
        </div>
      </div>`;
      })
      .join("");

    return `
      <div class="mb-3">
        <button type="button" class="btn btn-outline-primary btn-sm" onclick="toggleAllKhach()" id="btnToggleAll">
          👁️ Hiện tất cả khách
        </button>
      </div>
      <div class="row">${items}</div>
      <script>
        function toggleAllKhach(){
          const btn = document.getElementById('btnToggleAll');
          const els = document.querySelectorAll('.collapse-khach');
          const anyHidden = Array.from(els).some(el => el.classList.contains('d-none'));
          els.forEach(el => el.classList.toggle('d-none', !anyHidden));
          btn.innerText = anyHidden ? "🙈 Ẩn tất cả khách" : "👁️ Hiện tất cả khách";
        }
      </script>`;
  }

  Tao_Chuoi_HTML_Danh_sach_Phieu(ds, ctx = {}) {
    const Vai_tro = ctx.Vai_tro || "Khach";
    const Co_quyen = ["Tiep_tan", "Quan_ly", "Ban_Giam_doc"].includes(Vai_tro);
    const hang = (p) => `
            <tr>
                <td>${p.Ma_phieu}</td><td>${p.So_phong}</td><td>${p.Loai_phong
      }</td>
                <td>${p.Ngay_nhan}</td><td>${p.Ngay_tra}</td><td>${p.So_khach
      }</td>
                <td>${(p.Danh_sach_khach || [])
        .map((k) => k.Ho_ten)
        .join(", ")}</td>
                ${Co_quyen
        ? `<td>
                <form method="get" action="/Chon_Sua_Phieu" class="d-inline">
                    <input type="hidden" name="Ma_phieu" value="${p.Ma_phieu}">
                    <button class="btn btn-sm btn-warning">Sửa</button>
                </form>
                <form method="post" action="/Huy_Phieu" class="d-inline" onsubmit="return confirm('Xóa ${p.Ma_phieu}?')">
                    <input type="hidden" name="Ma_phieu" value="${p.Ma_phieu}">
                    <button class="btn btn-sm btn-danger">Xóa</button>
                </form>
                </td>`
        : ""
      }
            </tr>`;
    return `
            <div class="container pb-3">
            <h6>Kết quả tra cứu (${ds.length})</h6>
            <table class="table table-striped table-sm">
                <thead><tr>
                <th>Mã phiếu</th><th>Phòng</th><th>Loại</th>
                <th>Nhận</th><th>Trả</th><th>Số KH</th><th>Khách</th>
                ${Co_quyen ? "<th>Hành động</th>" : ""}
                </tr></thead>
                <tbody>${ds.map(hang).join("")}</tbody>
            </table>
            </div>`;
  }

  Tao_Chuoi_HTML_Sua_Phieu(pt) {
    const k = (i) => (pt.Danh_sach_khach || [])[i - 1] || {};
    return `
    <div class="container py-3">
      <h5 class="mb-3">Sửa phiếu ${pt.Ma_phieu}</h5>
  
      <div class="row g-2 mb-2">
        <!-- Form XÓA tách riêng, tránh lồng form -->
        <div class="col-6">
          <form method="post" action="/Huy_Phieu" onsubmit="return confirm('Xóa ${pt.Ma_phieu
      }?')">
            <input type="hidden" name="Ma_phieu" value="${pt.Ma_phieu}">
            <button class="btn btn-outline-danger">Xóa phiếu</button>
          </form>
        </div>
      </div>
  
      <form method="post" action="/Sua_Phieu" class="row g-2">
        <input type="hidden" name="Ma_phieu" value="${pt.Ma_phieu}">
  
        <div class="col-md-3">
          <label>Số phòng</label>
          <input name="So_phong" class="form-control" value="${pt.So_phong}">
        </div>
        <div class="col-md-3">
          <label>Ngày nhận</label>
          <input name="Ngay_nhan" type="date" class="form-control" value="${pt.Ngay_nhan
      }">
        </div>
        <div class="col-md-3">
          <label>Ngày trả</label>
          <input name="Ngay_tra" type="date" class="form-control" value="${pt.Ngay_tra
      }">
        </div>
  
        <!-- Loại phòng: CHỈ HIỂN THỊ (disabled) + hidden để submit -->
        <div class="col-md-3">
          <label>Loại phòng</label>
          <input class="form-control" value="${pt.Loai_phong}" disabled>
          <input type="hidden" name="Loai_phong" value="${pt.Loai_phong}">
        </div>
  
        <div class="col-md-2">
          <label>Số khách</label>
          <input name="So_khach" type="number" min="1" max="10" class="form-control" value="${pt.So_khach
      }">
        </div>
  
        <div class="col-12"><hr><small class="text-muted">Thông tin khách</small></div>
  
        ${[1, 2, 3, 4]
        .map(
          (i) => `
          <div class="col-md-6">
            <div class="border rounded p-2 mb-2">
              <div class="mb-2 input-group">
                <span class="input-group-text">Họ tên</span>  
                <input class="form-control" name="Khach_${i}_Ho_ten" value="${k(i).Ho_ten || ""
            }">
              </div>
              <div class="mb-2 input-group">
              <span class="input-group-text">CCCD/CMND</span>  
              <input class="form-control" name="Khach_${i}_CCCD" value="${k(i).CCCD || ""
            }">
                
              </div>
              <div class="mb-0 input-group">
                <span class="input-group-text">SĐT</span>
                <input class="form-control" name="Khach_${i}_Dien_thoai" value="${k(i).Dien_thoai || ""
            }">
              </div>
            </div>
          </div>
        `
        )
        .join("")}
  
        <div class="col-12 d-flex gap-2 mt-2">
          <button class="btn btn-success">Lưu thay đổi</button>
          <button type="button" id="btn_huy_sua" class="btn btn-outline-secondary">Hủy sửa</button>
        </div>
      </form>
  
      <script>
        document.getElementById('btn_huy_sua')?.addEventListener('click', ()=>{
          if (confirm('Bạn chắc chắn thoát ra?'))
            window.location.href = '/Quan_ly_Phieu';
        });
      </script>
    </div>`;
  }

  Tao_Chuoi_HTML_Bao_cao_Thang(BC) {
    const hang = (r) =>
      `<tr><td>${r.Loai_phong
      }</td><td class="text-end">${r.Thu.toLocaleString()}</td><td class="text-end">${r.Ty_le
      }%</td></tr>`;
    return `
    <div class="container py-3">
      <h5>Báo cáo thu tháng ${BC.Thang}/${BC.Nam}</h5>
      <table class="table table-bordered table-sm">
        <thead><tr><th>Loại phòng</th><th class="text-end">Thu</th><th class="text-end">Tỷ lệ</th></tr></thead>
        <tbody>${BC.Chi_tiet.map(hang).join("")}</tbody>
        <tfoot><tr><th>Tổng</th><th class="text-end">${BC.Tong_thu.toLocaleString()}</th><th></th></tr></tfoot>
      </table>
    </div>`;
  }

  Tao_Chuoi_HTML_Bao_cao_Nam(BC) {
    const hang = (r) =>
      `<tr><td>${r.Thang
      }</td><td class="text-end">${r.Thu.toLocaleString()}</td><td class="text-end">${r.Ty_le
      }%</td></tr>`;
    return `
    <div class="container py-3">
      <h5>Báo cáo thu năm ${BC.Nam}</h5>
      <table class="table table-bordered table-sm">
        <thead><tr><th>Tháng</th><th class="text-end">Thu</th><th class="text-end">Tỷ lệ</th></tr></thead>
        <tbody>${BC.Chi_tiet.map(hang).join("")}</tbody>
        <tfoot><tr><th>Tổng</th><th class="text-end">${BC.Tong_thu.toLocaleString()}</th><th></th></tr></tfoot>
      </table>
    </div>`;
  }

  Tao_Chuoi_HTML_Don_gia(user, opt) {
    // 1) Xác định quý đang xem (mặc định = quý hiện tại)
    let y, q;
    if (opt && Number.isFinite(opt.y) && Number.isFinite(opt.q))
    {
      y = +opt.y;
      q = +opt.q;
    } else
    {
      [y, q] = this.Lay_Quy_hien_tai();
    }

    // 2) Danh sách quý TRƯỚC quý hiện tại (2022 -> quý liền trước)
    const [cy, cq] = this.Lay_Quy_hien_tai();
    const periodsAll = this.Tu_QuyI_2022_den_nay(2022); // đã sort mới -> cũ
    const periodsPrev = periodsAll.filter(
      (p) => !(+p.y === +cy && +p.q === +cq)
    );

    const isCurrent = +y === +cy && +q === +cq;
    const { tu, den } = this.Tu_Ngay_Bat_dau_den_Ket_thuc_Quy(y, q);
    const rows = this.Don_gia_Theo_Quy(y, q);
    const tenLoai = { 1: "Standard", 2: "Deluxe", 3: "Suite" };

    const sel = periodsPrev
      .map(
        (p) =>
          `<option value="${p.y}-${p.q}" ${+p.y === +y && +p.q === +q ? "selected" : ""
          }>
         Q${p.q}/${p.y} (${this.Dinh_dang_Ngay_VN(
            p.tu
          )} → ${this.Dinh_dang_Ngay_VN(p.den)})
       </option>`
      )
      .join("");

    // 3) HÀM TẠO HÀNG - dùng chuỗi thường, tránh backtick lồng
    const row = (r) => {
      const gia = r.rec ? +r.rec.gia || 0 : 0;
      const hl = r.rec
        ? this.Dinh_dang_Ngay_VN(r.rec.hieu_luc_tu) +
        " → " +
        this.Dinh_dang_Ngay_VN(r.rec.hieu_luc_den)
        : "<i>Chưa có lịch sử</i>";
      return [
        "<tr>",
        "<td><b>",
        tenLoai[r.loai_id],
        "</b></td>",
        "<td>",
        '<input type="text" inputmode="numeric" class="form-control form-control-sm"',
        ' name="gia_',
        r.loai_id,
        '" value="',
        this.Dinh_dang_VND(gia),
        '" ',
        isCurrent ? "" : "disabled",
        "/>",
        "</td>",
        "<td>",
        hl,
        "</td>",
        "</tr>",
      ].join("");
    };

    // 4) Render
    return `
      <div class="d-flex align-items-center mb-3 gap-2 flex-wrap" >
        <h5 class="mb-0 me-2">Đơn giá các Quý trước:</h5>
        <form class="d-flex" method="post" action="/Don_gia/Xem">
          <select name="period" class="form-select form-select-sm me-2" style="width:320px">${sel}</select>
          <button class="btn btn-sm btn-primary">Xem</button>
        </form>
        <form class="d-inline-block ms-2" method="post" action="/Don_gia/Xem">
          <input type="hidden" name="period" value="${cy}-${cq}"/>
          <button class="btn btn-sm btn-outline-success">Xem Đơn giá Quý hiện tại</button>
        </form>
      </div>
  
      <div class="alert ${isCurrent ? "alert-info" : "alert-secondary"} py-2">
        Quý đang xem: <b>Q${q}/${y}</b> (${this.Dinh_dang_Ngay_VN(
      tu
    )} → ${this.Dinh_dang_Ngay_VN(den)}).
        ${isCurrent
        ? "Được phép thay đổi đơn giá."
        : "Các quý trước: chỉ xem, không được thay đổi."
      }
      </div>
  
      <form id="frmDonGia" method="post" action="/Don_gia/Cap_nhat">
        <input type="hidden" name="y" value="${y}"/>
        <input type="hidden" name="q" value="${q}"/>
        <table class="table table-bordered align-middle">
          <thead class="table-light">
            <tr><th style="width:160px">Loại phòng</th><th style="width:220px">Đơn giá (VND/đêm)</th><th>Hiệu lực</th></tr>
          </thead>
          <tbody>${rows.map(row).join("")}</tbody>
        </table>
        <div class="text-end">
          <button class="btn btn-success" ${isCurrent ? "" : "disabled"
      }>Lưu đơn giá Quý hiện tại</button>
        </div>
      </form>
  
      <script>
        (function(){
          const unfmt = v => (v||"").replace(/\\./g,"").replace(/\\D/g,"");
          const fmt   = v => (Number(v||0)).toLocaleString("vi-VN");
          document.querySelectorAll('input[name^="gia_"]').forEach(inp=>{
            inp.value = fmt(unfmt(inp.value));
            inp.addEventListener('input', e=>{
              const raw = unfmt(e.target.value);
              e.target.value = fmt(raw);
            });
          });
          document.getElementById('frmDonGia')?.addEventListener('submit', ()=>{
            document.querySelectorAll('input[name^="gia_"]').forEach(inp=>{
              inp.value = unfmt(inp.value);
            });
          });
        })();
      </script>
    `;
  }

  Tao_Chuoi_HTML_Bao_cao_Thu_Thang(bc, { y, m }) {
    if (typeof this.Tao_Chuoi_HTML_Bao_cao_Thang === "function")
      return this.Tao_Chuoi_HTML_Bao_cao_Thang(bc, { y, m });
    if (typeof this.UI_Bao_cao_Thu_Thang === "function")
      return this.UI_Bao_cao_Thu_Thang(bc, { y, m });

    // Fallback: render chung
    return this.__Render_Bao_cao_Thu_Generic(
      bc,
      `Báo cáo tháng ${String(m).padStart(2, "0")}/${y}`
    );
  }

  Tao_Chuoi_HTML_Bao_cao_Thu_Nam(bc, { y }) {
    if (typeof this.Tao_Chuoi_HTML_Bao_cao_Nam === "function")
      return this.Tao_Chuoi_HTML_Bao_cao_Nam(bc, { y });
    if (typeof this.UI_Bao_cao_Thu_Nam === "function")
      return this.UI_Bao_cao_Thu_Nam(bc, { y });

    return this.__Render_Bao_cao_Thu_Generic(bc, `Báo cáo năm ${y}`);
  }

  __Render_Bao_cao_Thu_Generic(bc, tieu_de = "Báo cáo") {
    // bc có thể là {Tong, Theo_loai, Danh_sach} hoặc mảng phiếu...
    const fmtVND = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

    // Thử đoán cấu trúc
    let tong = 0,
      theo_loai = [],
      ds = [];
    if (bc && typeof bc === "object")
    {
      if (Array.isArray(bc.Danh_sach)) ds = bc.Danh_sach;
      else if (Array.isArray(bc)) ds = bc;
      if (bc.Tong != null) tong = Number(bc.Tong);
      if (Array.isArray(bc.Theo_loai)) theo_loai = bc.Theo_loai;
    } else if (Array.isArray(bc))
    {
      ds = bc;
    }

    // Nếu không có tổng, tự tính từ ds.Tien_thue
    if (!tong && Array.isArray(ds))
    {
      tong = ds.reduce((s, p) => s + Number(p?.Tien_thue || 0), 0);
    }

    // Bảng theo loại (nếu có)
    const tblLoai = (theo_loai || []).length
      ? `
    <h6 class="mt-3">Tổng hợp theo loại phòng</h6>
    <table class="table table-sm">
      <thead><tr><th>Loại phòng</th><th class="text-end">Doanh thu</th></tr></thead>
      <tbody>
        ${theo_loai
        .map(
          (r) => `
          <tr><td>${r?.Loai_phong || ""}</td><td class="text-end">${fmtVND(
            r?.Doanh_thu || 0
          )}</td></tr>
        `
        )
        .join("")}
      </tbody>
    </table>`
      : "";

    // Danh sách phiếu rút gọn
    const cards = (ds || [])
      .slice(0, 100)
      .map(
        (p) => `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="border rounded p-3 mb-3">
        <div class="fw-bold">${p?.So_phong || ""} – ${p?.Loai_phong || ""}</div>
        <div class="text-muted small">${p?.Ngay_nhan || ""} → ${p?.Ngay_tra || ""
          }</div>
        <div><b>Tiền thuê:</b> ${fmtVND(p?.Tien_thue || 0)}</div>
      </div>
    </div>`
      )
      .join("");

    return `
    <div class="mb-3">
      <h6 class="mb-1">${tieu_de}</h6>
      <div><b>Tổng doanh thu:</b> ${fmtVND(tong)}</div>
      ${tblLoai}
      <div class="row mt-3">${cards || `<div class='text-muted'>Không có dữ liệu.</div>`
      }</div>
    </div>`;
  }

  // === UI ===
  UI_Quan_ly_Phieu(user) {
    if (user?.Vai_tro === "Tiep_tan" && user?.Khu_vuc)
    {
      const kv = String(user.Khu_vuc).toUpperCase();
      dsPhieu = (dsPhieu || []).filter(
        (p) => this.Lay_Khu_vuc_tu_So_phong(p.So_phong) === kv
      );
    }
  }

  UI_Chon_Bao_cao_Thang(user) {
    const { y: cy, m: cm } = this.Lay_Thang_Nam_Hien_tai();
    const cm2 = String(cm).padStart(2, "0");
    return `
      <div class="container">
        <h5>Báo cáo tháng</h5>
        <div class="d-flex gap-2 align-items-center mb-3 px-2 gap-4">
          <select id="sel_thang" class="form-select" style="width:100px; height: 40px">
            ${this.Tu_Thang_01_2022_Den_Thang_truoc()}
          </select>
          <button id="btn_xem_thang" class="btn btn-primary" style="height:40px;margin-left:16px!important;">Xem</button>
          <button id="btn_tam_tinh_thang" class="btn btn-outline-primary me-3" style="height:40px;margin-left:16px!important;">Tạm tính cho Tháng hiện tại</button>
        </div>
        <div id="kq_thang"></div>
      </div>
      <script>
        (()=> {
          const kq = document.getElementById('kq_thang');
          const sel = document.getElementById('sel_thang');
          const xem = document.getElementById('btn_xem_thang');
          const tam = document.getElementById('btn_tam_tinh_thang');
    
          async function loadPartial(url){
            const rsp = await fetch(url, { headers: { "X-Requested-With": "fetch" }});
            const html = await rsp.text();
            kq.innerHTML = html;
          }
          xem.addEventListener('click', (e)=>{
            e.preventDefault();
            const ym = sel.value; // yyyy-mm
            if (!ym) { kq.innerHTML = "<div class='text-muted'>Hãy chọn tháng.</div>"; return; }
            const [y,m] = ym.split('-');
            loadPartial(\`/Bao_cao_Thu_Thang?partial=1&y=\${y}&m=\${m}\`);
          });
          tam.addEventListener('click', (e)=>{
            e.preventDefault();
            loadPartial('/Bao_cao_Thu_Thang?partial=1&current=1');
          });
        })();
      </script>`;
  }

  UI_Chon_Bao_cao_Nam(user) {
    const { y: cy } = this.Lay_Thang_Nam_Hien_tai();
    return `
      <div class="container">
        <h5>Báo cáo năm</h5>
        <div class="d-flex gap-2 align-items-center mb-3">
          <select id="sel_nam" class="form-select" style="width:100px; height: 40px">
            ${this.Tu_Nam_2022_Den_Nam_truoc()}
          </select>
          <button id="btn_xem_nam" class="btn btn-primary" style="height:40px;margin-left:16px!important;">Xem</button>
          <button id="btn_tam_tinh_nam" class="btn btn-outline-primary" style="height:40px;margin-left:16px!important;">Tạm tính cho Năm hiện tại</button>
        </div>
        <div id="kq_nam"></div>
      </div>
      <script>
        (()=> {
          const kq = document.getElementById('kq_nam');
          const sel = document.getElementById('sel_nam');
          const xem = document.getElementById('btn_xem_nam');
          const tam = document.getElementById('btn_tam_tinh_nam');
    
          async function loadPartial(url){
            const rsp = await fetch(url, { headers: { "X-Requested-With": "fetch" }});
            const html = await rsp.text();
            kq.innerHTML = html;
          }
          xem.addEventListener('click', (e)=>{
            e.preventDefault();
            const y = sel.value;
            if (!y) { kq.innerHTML = "<div class='text-muted'>Hãy chọn năm.</div>"; return; }
            loadPartial(\`/Bao_cao_Thu_Nam?partial=1&y=\${y}\`);
          });
          tam.addEventListener('click', (e)=>{
            e.preventDefault();
            loadPartial('/Bao_cao_Thu_Nam?partial=1&current=1');
          });
        })();
      </script>`;
  }

  UI_Don_gia_Xem(Bo_loc) {
    const che_do = Bo_loc && Bo_loc.Che_do ? Bo_loc.Che_do : "Hien_tai";
    let du_lieu;
    if (che_do === "Quy")
    {
      du_lieu = this.Tra_cuu_Don_gia({ Quy: Bo_loc?.Quy, Nam: Bo_loc?.Nam });
    } else if (che_do === "Khoang")
    {
      du_lieu = this.Tra_cuu_Don_gia({
        Tu_ngay: Bo_loc?.Tu_ngay,
        Den_ngay: Bo_loc?.Den_ngay,
      });
    } else
    {
      du_lieu = this.Tra_cuu_Don_gia({});
    }
    return this.Tao_Chuoi_HTML_Don_gia(du_lieu);
  }

  UI_Don_gia_Hien_tai(user) {
    // [DEPRECATED] Su dung UI_Don_gia_Xem({Che_do:"Hien_tai"}) thay the
    return this.UI_Don_gia_Xem({ Che_do: "Hien_tai" });
  }

  UI_Don_gia_Xem_Period(user, period) {
    let y, q;
    if (/^\d{4}-[1-4]$/.test(period || ""))
    {
      const [yy, qq] = period.split("-");
      y = +yy;
      q = +qq;
    } else
    {
      [y, q] = this.Lay_Quy_hien_tai?.() ?? [
        new Date().getFullYear(),
        Math.floor(new Date().getMonth() / 3) + 1,
      ];
    }
    return this.Tao_Chuoi_HTML_Don_gia?.(user, { y, q }) ?? "";
  }

  UI_Don_gia_Cap_nhat(user, body) {
    try
    {
      const pick = (a, d) => (a !== undefined ? a : d);
      const y = Number(pick(body.y, body.Th_Nam));
      const q = Number(pick(body.q, body.Th_Quy));
      if (!Number.isInteger(y) || !Number.isInteger(q))
        throw new Error("Thiếu hoặc sai Quý/Năm");
      if (this.IsCurrentQuarter && !this.IsCurrentQuarter(y, q))
        throw new Error("Chỉ cập nhật ở Quý hiện tại");

      const vnd = (s) => Number(String(s || "").replace(/[^\d]/g, "")) || 0;
      const gia1 = vnd(pick(body.gia_1, body.Th_Gia_Standard));
      const gia2 = vnd(pick(body.gia_2, body.Th_Gia_Deluxe));
      const gia3 = vnd(pick(body.gia_3, body.Th_Gia_Suite));
      if (gia1 <= 0 || gia2 <= 0 || gia3 <= 0) throw new Error("Giá phải > 0");
      if (!(gia1 < gia2 && gia2 < gia3))
        throw new Error("Standard < Deluxe < Suite");

      this.Cap_nhat_Don_gia_Quy?.({ y, q, gia1, gia2, gia3 });
      const ok = `<div class='alert alert-success'>Đã cập nhật đơn giá Q${q}/${y}</div>`;
      return (
        ok +
        (this.Tao_Chuoi_HTML_Don_gia?.(user, { y, q }) ??
          this.Tao_HTML_Don_gia?.(user, { y, q }) ??
          "")
      );
    } catch (e)
    {
      const [cy, cq] = this.Lay_Quy_hien_tai?.() ?? [
        new Date().getFullYear(),
        Math.floor(new Date().getMonth() / 3) + 1,
      ];
      const er = `<div class='alert alert-danger'>${e.message || String(e)
        }</div>`;
      return (
        er +
        (this.Tao_Chuoi_HTML_Don_gia?.(user, { y: cy, q: cq }) ??
          this.Tao_HTML_Don_gia?.(user, { y: cy, q: cq }) ??
          "")
      );
    }
  }

  UI_Cap_nhat_Gia_Loai_phong(user, body) {
    if (!user || user.Bo_phan !== "BGD")
    {
      const warn = "<div class='alert alert-danger'>Chỉ BGĐ được phép</div>";
      return (
        warn +
        (this.Tao_Chuoi_HTML_Don_gia?.(user) ??
          this.Tao_HTML_Don_gia?.(user) ??
          "")
      );
    }
    const vnd = (s) => Number(String(s ?? "").replace(/[^\d]/g, "")) || 0;
    const loaiId = Number(body.loaiId ?? body.Th_LoaiId);
    const giaMoi = vnd(body.giaMoi ?? body.Th_GiaMoi);
    if (!Number.isInteger(loaiId))
      return (
        "<div class='alert alert-danger'>Loại phòng không hợp lệ</div>" +
        (this.Tao_Chuoi_HTML_Don_gia?.(user) ??
          this.Tao_HTML_Don_gia?.(user) ??
          "")
      );
    if (giaMoi <= 0)
      return (
        "<div class='alert alert-danger'>Giá không hợp lệ</div>" +
        (this.Tao_Chuoi_HTML_Don_gia?.(user) ??
          this.Tao_HTML_Don_gia?.(user) ??
          "")
      );
    const ok = this.Cap_nhat_Gia_Loai?.(loaiId, giaMoi);
    const msg = `<div class='alert alert-${ok ? "success" : "warning"}'>${ok ? "Đã cập nhật giá" : "Không tìm thấy loại phòng"}</div>`;
    return (
      msg +
      (this.Tao_Chuoi_HTML_Don_gia?.(user) ??
        this.Tao_HTML_Don_gia?.(user) ??
        "")
    );
  }
}
module.exports = new XL_3L();
