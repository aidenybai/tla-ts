(*---
description: Isabelle checks the Zenon proof of a goal about both branches of an IF.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory if_branches imports Constant Zenon begin
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
fixes a_CONSTANTunde_punde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
fixes a_CONSTANTunde_Sunde_a
shows "(((((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<and> (((a_CONSTANTunde_yunde_a) \<in> (a_CONSTANTunde_Sunde_a))))) \<Rightarrow> (((cond((a_CONSTANTunde_punde_a), (a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a))) \<in> (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (=> (/\ (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
(TLA.in a_CONSTANTunde_yunde_a a_CONSTANTunde_Sunde_a))
(TLA.in (TLA.cond a_CONSTANTunde_punde_a a_CONSTANTunde_xunde_a a_CONSTANTunde_yunde_a)
a_CONSTANTunde_Sunde_a))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(~(((a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_yunde_a \\in a_CONSTANTunde_Sunde_a))=>(cond(a_CONSTANTunde_punde_a, a_CONSTANTunde_xunde_a, a_CONSTANTunde_yunde_a) \\in a_CONSTANTunde_Sunde_a)))" (is "~(?z_hc=>?z_hi)")
 have z_Hc: "?z_hc" (is "?z_hd&?z_hg")
 by (rule zenon_notimply_0 [OF z_Ha])
 have z_Hl: "(~?z_hi)"
 by (rule zenon_notimply_1 [OF z_Ha])
 have z_Hd: "?z_hd"
 by (rule zenon_and_0 [OF z_Hc])
 have z_Hg: "?z_hg"
 by (rule zenon_and_1 [OF z_Hc])
 show FALSE
 proof (rule zenon_ifthenelse [of "(\<lambda>zenon_Vg. (~(zenon_Vg \\in a_CONSTANTunde_Sunde_a)))" "a_CONSTANTunde_punde_a" "a_CONSTANTunde_xunde_a" "a_CONSTANTunde_yunde_a", OF z_Hl])
  assume z_Hk:"a_CONSTANTunde_punde_a"
  assume z_Hq:"(~?z_hd)"
  show FALSE
  by (rule notE [OF z_Hq z_Hd])
 next
  assume z_Hr:"(~a_CONSTANTunde_punde_a)"
  assume z_Hs:"(~?z_hg)"
  show FALSE
  by (rule notE [OF z_Hs z_Hg])
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
