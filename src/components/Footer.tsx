import React from "react";
import Link from "next/link";
import { Landmark, Shield, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Col 1: Administrative Info */}
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-3">
              <Landmark className="w-5 h-5 text-red-500" />
              <span>ỦY BAN MTTQ XÃ EA SÚP</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Nền tảng thi trắc nghiệm trực tuyến phục vụ công tác tuyên truyền phổ biến giáo dục pháp luật, học tập nghị quyết và chuyển đổi số cho 20 thôn, buôn và các khối đoàn thể xã Ea Súp.
            </p>
            <div className="text-xs text-slate-400">
              Thuộc <strong>Hệ sinh thái chuyển đổi số easupso.com</strong>
            </div>
          </div>

          {/* Col 2: Contact Details */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">
              Thông tin liên hệ Ban Tổ chức
            </h4>
            <div className="text-xs font-semibold text-amber-400 mb-2">
              Thường trực UB MTTQ Việt Nam xã Ea Súp
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>72 Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href="tel:0888023023" className="hover:text-white transition-colors">
                  0888023023
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href="mailto:Easupsohoa@gmail.com" className="hover:text-white transition-colors">
                  Easupsohoa@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center sm:text-left text-xs text-slate-400">
          © {new Date().getFullYear()} Ủy ban MTTQ Việt Nam xã Ea Súp. Bản quyền thuộc Hệ sinh thái chuyển đổi số easupso.com.
        </div>
      </div>
    </footer>
  );
}
