(*---
description: auto proves [a |-> x, b |-> y].b = y, which needs the distinct strings "a" and "b".
ref: isabelle/Strings.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory record_field imports Constant Zenon begin
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
lemma ob'1: (* 1639f296bfa599dfb83b58b78a5488e8 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((fapply ((((''a'' :> (a_CONSTANTunde_xunde_a)) @@ (''b'' :> (a_CONSTANTunde_yunde_a)))), (''b''))) = (a_CONSTANTunde_yunde_a)))"(is "PROP ?ob'1")
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
