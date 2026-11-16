(*---
description: Isabelle checks the Zenon proof of x \in S => x \in S \cup T, which uses zenon_notin_cup.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory in_cup imports Constant Zenon begin
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
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<Rightarrow> (((a_CONSTANTunde_xunde_a) \<in> (((a_CONSTANTunde_Sunde_a) \<union> (a_CONSTANTunde_Tunde_a)))))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (=> (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
(TLA.in a_CONSTANTunde_xunde_a (TLA.cup a_CONSTANTunde_Sunde_a
a_CONSTANTunde_Tunde_a)))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(~((a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)=>(a_CONSTANTunde_xunde_a \\in (a_CONSTANTunde_Sunde_a \\cup a_CONSTANTunde_Tunde_a))))" (is "~(?z_hc=>?z_hf)")
 have z_Hc: "?z_hc"
 by (rule zenon_notimply_0 [OF z_Ha])
 have z_Hi: "(~?z_hf)"
 by (rule zenon_notimply_1 [OF z_Ha])
 have z_Hj: "(~?z_hc)"
 by (rule zenon_notin_cup_0 [of "a_CONSTANTunde_xunde_a" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Hi])
 show FALSE
 by (rule notE [OF z_Hj z_Hc])
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
