(*---
description: auto proves <<x, y>>[1] = x.
ref: isabelle/Tuples.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory tuple_app imports Constant Zenon begin
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
lemma ob'1: (* 48ddbafc03d23f70ec648d9ee3926b8e *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((fapply ((<<(a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)>>), ((succ[0])))) = (a_CONSTANTunde_xunde_a)))"(is "PROP ?ob'1")
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
