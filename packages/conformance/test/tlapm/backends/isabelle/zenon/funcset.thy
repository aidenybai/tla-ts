(*---
description: Isabelle checks the Zenon proof of f[x] \in T for f \in [S -> T].
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory funcset imports Constant Zenon begin
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
fixes a_CONSTANTunde_funde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((((a_CONSTANTunde_funde_a) \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> (a_CONSTANTunde_Tunde_a)]))) \<and> (((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))))) \<Rightarrow> (((fapply ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_xunde_a))) \<in> (a_CONSTANTunde_Tunde_a)))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (=> (/\ (TLA.in a_CONSTANTunde_funde_a
(TLA.FuncSet a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a))
(TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a))
(TLA.in (TLA.fapply a_CONSTANTunde_funde_a a_CONSTANTunde_xunde_a)
a_CONSTANTunde_Tunde_a))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(~(((a_CONSTANTunde_funde_a \\in FuncSet(a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Tunde_a))&(a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a))=>((a_CONSTANTunde_funde_a[a_CONSTANTunde_xunde_a]) \\in a_CONSTANTunde_Tunde_a)))" (is "~(?z_hc=>?z_hk)")
 have z_Hc: "?z_hc" (is "?z_hd&?z_hi")
 by (rule zenon_notimply_0 [OF z_Ha])
 have z_Hm: "(~?z_hk)"
 by (rule zenon_notimply_1 [OF z_Ha])
 have z_Hd: "?z_hd"
 by (rule zenon_and_0 [OF z_Hc])
 have z_Hi: "?z_hi"
 by (rule zenon_and_1 [OF z_Hc])
 have z_Hn: "(\\A zenon_Vm:((zenon_Vm \\in a_CONSTANTunde_Sunde_a)=>((a_CONSTANTunde_funde_a[zenon_Vm]) \\in a_CONSTANTunde_Tunde_a)))" (is "\\A x : ?z_ht(x)")
 by (rule zenon_in_funcset_2 [of "a_CONSTANTunde_funde_a" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Hd])
 have z_Hu: "?z_ht(a_CONSTANTunde_xunde_a)"
 by (rule zenon_all_0 [of "?z_ht" "a_CONSTANTunde_xunde_a", OF z_Hn])
 show FALSE
 proof (rule zenon_imply [OF z_Hu])
  assume z_Hv:"(~?z_hi)"
  show FALSE
  by (rule notE [OF z_Hv z_Hi])
 next
  assume z_Hk:"?z_hk"
  show FALSE
  by (rule notE [OF z_Hm z_Hk])
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
