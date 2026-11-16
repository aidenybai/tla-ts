(*---
description: 'auto does not apply chooseI, so it leaves P(CHOOSE a : P(a)) open even with P(x).'
ref: isabelle/PredicateLogic.thy
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory choose_witness_auto_fails imports Constant Zenon begin
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
lemma ob'1: (* 7f7d8a0c645c464a276584b127ce469e *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Punde_a
shows "((((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a)))) \<Rightarrow> ((a_CONSTANTunde_Punde_a ((Choice(%a_CONSTANTunde_aunde_a. ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_aunde_a)))))))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
