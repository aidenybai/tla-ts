(* automatically generated -- do not edit manually *)
theory tlapm_fbbb4a imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./Level_test.tla", line 122, characters 1-7 *)
lemma ob'3: (* 91511908262515f318504829c125c0cf *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_cunde_a
fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
fixes a_VARIABLEunde_yunde_a a_VARIABLEunde_yunde_a'
(* usable definition STATE_P_ suppressed *)
(* usable definition CONSTANT_f_ suppressed *)
(* usable definition CONSTANT_h_ suppressed *)
(* usable definition ACTION_Q_ suppressed *)
shows "((SortSeq ((<<((succ[0])), ((succ[succ[0]])), ((succ[succ[succ[0]]]))>>), (\<lambda> a_Unknownunde_x1unde_a a_Unknownunde_x2unde_a . ((less ((a_Unknownunde_x1unde_a), (a_Unknownunde_x2unde_a))))))))"(is "PROP ?ob'3")
proof -
show "PROP ?ob'3"
by auto
qed
end
