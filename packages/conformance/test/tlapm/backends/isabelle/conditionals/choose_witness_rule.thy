(*---
description: >-
  BY IsaM("(rule chooseI)") makes tlapm write using assms by (rule chooseI), which proves P(CHOOSE a
  : P(a)) from the assumption P(x).
ref: isabelle/PredicateLogic.thy#chooseI
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory choose_witness_rule imports Constant Zenon begin
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
lemma ob'1: (* cafb0516f6640489913bef38946ac429 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Punde_a
assumes v'6: "((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a))))"
shows "((a_CONSTANTunde_Punde_a ((Choice(%a_CONSTANTunde_aunde_a. ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_aunde_a)))))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by (rule chooseI)
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
