(*---
description: '[A]_v is expanded to A \/ UNCHANGED v, with A and UNCHANGED v as separate atoms.'
ref: src/expr/e_tla_norm.ml#expand_action
mode: encoding
outcome: proved
---*)
---- MODULE square_action_expanded ----
EXTENDS Naturals, TLAPS
VARIABLE x, y
THEOREM [][x' = x + 1]_x => [](x' = x + 1 \/ UNCHANGED x)
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./square_action_expanded.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory square_action_expanded imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    end

    --- ls4
    not (((always (cc | ~ cc)) -> ((always (hb2120 | h0d12a)) -> (always (hb2120 | h0d12a)))))
---*)
