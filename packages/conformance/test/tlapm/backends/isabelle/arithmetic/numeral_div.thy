(*---
description: >-
  tlapm writes \div as isa_bksl_diva, a fresh constant its theory header declares, not the div of
  IntegerDivision, so simp cannot evaluate 7 \div 2 = 3.
ref: src/backend/isabelle.ml#thy_header
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory numeral_div imports Constant Zenon begin
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
lemma ob'1: (* a9c05ec5dde2c581f6671cdd84d3f1b5 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
shows "((((isa_bksl_diva (((succ[succ[succ[succ[succ[succ[succ[0]]]]]]])), ((succ[succ[0]]))))) = ((succ[succ[succ[0]]]))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
