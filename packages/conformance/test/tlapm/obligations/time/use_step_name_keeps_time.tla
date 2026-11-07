(*---
description: A USE of a step name keeps the time of the step's fact, which is the scope's time when the step was proved.
ref: src/proof/p_gen.ml#gen_step
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE use_step_name_keeps_time ----
EXTENDS TLAPS
VARIABLE x
THEOREM ASSUME [](x = 0) PROVE [](x = 0)
<1>1. x = 0
  BY PTL
<1> USE ONLY <1>1
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 16:6:16:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:6:16:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 13:3:13:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 13:6:13:9
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 13:6:13:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 14:14:14:18
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 14:14:14:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    File "./use_step_name_keeps_time.tla", line 8, character 1 to line 17, character 4:
    [INFO]: All 5 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory use_step_name_keeps_time imports Constant Zenon begin
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
    not (((always (always h4ca64)) & (always (cc | ~ cc)) -> h4ca64))

    --- ls4
    not (((always h4ca64) & (always (cc | ~ cc)) -> (always h4ca64)))
---*)
