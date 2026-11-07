(*---
description: auto proves 2 \in 1..3.
ref: isabelle/IntegerArithmetic.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory range_member imports Constant Zenon begin
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
lemma ob'1: (* b71e562e4aebd350fbcb93184503f446 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
shows "((((succ[succ[0]])) \<in> ((intvl (((succ[0])), ((succ[succ[succ[0]]])))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
