(*---
description: >-
  BY IsaM("simp") rewrites a function application with the fapply simp rule, using the assumption x
  \in S.
ref: isabelle/Functions.thy#fapply
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory simp_fcn_app imports Constant Zenon begin
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
lemma ob'1: (* 5961f13b037c9b904897de8966643fd2 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Funde_a
fixes a_CONSTANTunde_xunde_a
assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a))"
shows "(((fapply (([ a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_aunde_a))))]), (a_CONSTANTunde_xunde_a))) = ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_xunde_a))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
