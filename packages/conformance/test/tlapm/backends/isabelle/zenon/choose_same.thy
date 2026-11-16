(*---
description: >-
  Isabelle checks the Zenon proof that two CHOOSEs with the same body are equal, closed by
  zenon_noteq.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory choose_same imports Constant Zenon begin
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
fixes a_CONSTANTunde_xunde_a
shows "(((bChoice((a_CONSTANTunde_Sunde_a), %a_CONSTANTunde_aunde_a. (((a_CONSTANTunde_aunde_a) = (a_CONSTANTunde_xunde_a))))) = (bChoice((a_CONSTANTunde_Sunde_a), %a_CONSTANTunde_bunde_a. (((a_CONSTANTunde_bunde_a) = (a_CONSTANTunde_xunde_a)))))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (= (TLA.bChoice a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_aunde_a) (= a_CONSTANTunde_aunde_a
a_CONSTANTunde_xunde_a)))
(TLA.bChoice a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_bunde_a) (= a_CONSTANTunde_bunde_a
a_CONSTANTunde_xunde_a))))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(bChoice(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_aunde_a. (a_CONSTANTunde_aunde_a=a_CONSTANTunde_xunde_a)))~=bChoice(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_aunde_a. (a_CONSTANTunde_aunde_a=a_CONSTANTunde_xunde_a))))" (is "?z_hb~=_")
 show FALSE
 by (rule zenon_noteq [OF z_Ha])
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
