(*---
description: Isabelle checks the Zenon proof that equal pairs have equal components.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory tuple_eq imports Constant Zenon begin
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
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
fixes a_CONSTANTunde_zunde_a
fixes a_CONSTANTunde_wunde_a
shows "(((((<<(a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)>>) = (<<(a_CONSTANTunde_zunde_a), (a_CONSTANTunde_wunde_a)>>))) \<Rightarrow> (((a_CONSTANTunde_yunde_a) = (a_CONSTANTunde_wunde_a)))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (=> (= (TLA.tuple a_CONSTANTunde_xunde_a a_CONSTANTunde_yunde_a)
(TLA.tuple a_CONSTANTunde_zunde_a a_CONSTANTunde_wunde_a))
(= a_CONSTANTunde_yunde_a
a_CONSTANTunde_wunde_a))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(~((<<a_CONSTANTunde_xunde_a, a_CONSTANTunde_yunde_a>>=<<a_CONSTANTunde_zunde_a, a_CONSTANTunde_wunde_a>>)=>(a_CONSTANTunde_yunde_a=a_CONSTANTunde_wunde_a)))" (is "~(?z_hc=>?z_hj)")
 have z_Hc: "?z_hc" (is "?z_hd=?z_hg")
 by (rule zenon_notimply_0 [OF z_Ha])
 have z_Hk: "(a_CONSTANTunde_yunde_a~=a_CONSTANTunde_wunde_a)"
 by (rule zenon_notimply_1 [OF z_Ha])
 have z_Hj: "?z_hj"
 using z_Hc by auto
 show FALSE
 by (rule notE [OF z_Hk z_Hj])
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
