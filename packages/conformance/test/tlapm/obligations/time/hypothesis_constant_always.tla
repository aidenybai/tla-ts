(*---
description: A constant-level theorem hypothesis is box-closed, so it has the time Always.
ref: src/expr/e_temporal_props.ml#compute_time
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE hypothesis_constant_always ----
EXTENDS TLAPS
CONSTANT c
VARIABLE x
THEOREM ASSUME c = 0 PROVE [](c = 0)
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 13:6:13:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:6:13:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./hypothesis_constant_always.tla", line 8, character 1 to line 14, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory hypothesis_constant_always imports Constant Zenon begin
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
    not (((always h7de6a) & (always (cc | ~ cc)) -> (always h7de6a)))
---*)
