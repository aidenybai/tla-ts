(*---
description: Isabelle proves that every natural number equals itself by auto, the theory tlapm writes for BY Isa.
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory forall_nat_reflexive imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./U.tla", line 8, characters 3-4 *)
lemma ob'5: (* d31940e1385d5f4776cfa9062c987eda *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
shows "(\<forall> a_CONSTANTunde_xunde_a \<in> (Nat) : (((a_CONSTANTunde_xunde_a) = (a_CONSTANTunde_xunde_a))))"(is "PROP ?ob'5")
proof -
show "PROP ?ob'5"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
