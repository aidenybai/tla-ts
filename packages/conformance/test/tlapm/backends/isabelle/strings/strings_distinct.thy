(*---
description: 'simp proves "a" # "b".'
ref: isabelle/Strings.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory strings_distinct imports Constant Zenon begin
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
lemma ob'1: (* b2424f25ab85c695c6811b4a0bbb8ed3 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
shows "(((''a'') \<noteq> (''b'')))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
