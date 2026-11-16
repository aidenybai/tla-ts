(*---
description: Isabelle checks the Zenon proof of S \cup T = T \cup S by extensionality.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory setequal imports Constant Zenon begin
ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

lemma ob'1:
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((a_CONSTANTunde_Sunde_a) \<union> (a_CONSTANTunde_Tunde_a))) = (((a_CONSTANTunde_Tunde_a) \<union> (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (= (TLA.cup a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a)
(TLA.cup a_CONSTANTunde_Tunde_a
a_CONSTANTunde_Sunde_a))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"((a_CONSTANTunde_Sunde_a \\cup a_CONSTANTunde_Tunde_a)~=(a_CONSTANTunde_Tunde_a \\cup a_CONSTANTunde_Sunde_a))" (is "?z_hb~=?z_he")
 have z_Hf: "(~(\\A zenon_Vg:((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" (is "~(\\A x : ?z_hl(x))")
 by (rule zenon_notsetequal_0 [of "?z_hb" "?z_he", OF z_Ha])
 have z_Hm: "(\\E zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" (is "\\E x : ?z_ho(x)")
 by (rule zenon_notallex_0 [of "?z_hl", OF z_Hf])
 have z_Hp: "?z_ho((CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he)))))" (is "~(?z_hr<=>?z_hs)")
 by (rule zenon_ex_choose_0 [of "?z_ho", OF z_Hm])
 show FALSE
 proof (rule zenon_notequiv [OF z_Hp])
  assume z_Ht:"(~?z_hr)"
  assume z_Hs:"?z_hs"
  have z_Hu: "(~((CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he)))) \\in a_CONSTANTunde_Sunde_a))" (is "~?z_hv")
  by (rule zenon_notin_cup_0 [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Ht])
  have z_Hw: "(~((CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he)))) \\in a_CONSTANTunde_Tunde_a))" (is "~?z_hx")
  by (rule zenon_notin_cup_1 [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Ht])
  show FALSE
  proof (rule zenon_in_cup [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Tunde_a" "a_CONSTANTunde_Sunde_a", OF z_Hs])
   assume z_Hx:"?z_hx"
   show FALSE
   by (rule notE [OF z_Hw z_Hx])
  next
   assume z_Hv:"?z_hv"
   show FALSE
   by (rule notE [OF z_Hu z_Hv])
  qed
 next
  assume z_Hr:"?z_hr"
  assume z_Hy:"(~?z_hs)"
  have z_Hw: "(~((CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he)))) \\in a_CONSTANTunde_Tunde_a))" (is "~?z_hx")
  by (rule zenon_notin_cup_0 [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Tunde_a" "a_CONSTANTunde_Sunde_a", OF z_Hy])
  have z_Hu: "(~((CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he)))) \\in a_CONSTANTunde_Sunde_a))" (is "~?z_hv")
  by (rule zenon_notin_cup_1 [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Tunde_a" "a_CONSTANTunde_Sunde_a", OF z_Hy])
  show FALSE
  proof (rule zenon_in_cup [of "(CHOOSE zenon_Vg:(~((zenon_Vg \\in ?z_hb)<=>(zenon_Vg \\in ?z_he))))" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Hr])
   assume z_Hv:"?z_hv"
   show FALSE
   by (rule notE [OF z_Hu z_Hv])
  next
   assume z_Hx:"?z_hx"
   show FALSE
   by (rule notE [OF z_Hw z_Hx])
  qed
 qed
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
