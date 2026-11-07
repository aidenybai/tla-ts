(*---
description: An ASSUME with facts makes tlapm write assumes and then using assms by auto.
ref: src/backend/isabelle.ml#thy_temp
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory using_assms imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./G.tla", line 5, characters 3-4 *)
lemma ob'1: (* 7b8f77e1fcb53316160fd8e718888e67 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
fixes a_CONSTANTunde_xunde_a
assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a))"
assumes v'7: "(((a_CONSTANTunde_Sunde_a) \<subseteq> (a_CONSTANTunde_Tunde_a)))"
shows "(((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Tunde_a)))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
