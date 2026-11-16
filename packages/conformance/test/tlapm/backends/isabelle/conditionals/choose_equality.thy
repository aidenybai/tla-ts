(*---
description: 'auto proves (CHOOSE a : a = x) = x with the choose_equality intro rule.'
ref: isabelle/PredicateLogic.thy#choose_equality
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory choose_equality imports Constant Zenon begin
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
lemma ob'1: (* 2361cd7bb6b4f6ffbf2266a538b9095a *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
shows "(((Choice(%a_CONSTANTunde_aunde_a. (((a_CONSTANTunde_aunde_a) = (a_CONSTANTunde_xunde_a))))) = (a_CONSTANTunde_xunde_a)))"(is "PROP ?ob'1")
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
