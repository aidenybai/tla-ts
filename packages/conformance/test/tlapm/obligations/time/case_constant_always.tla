(*---
description: The assumption of CASE c = 0 for a constant c is box-closed, so it has the time Always.
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: incomplete
---*)
---- MODULE case_constant_always ----
EXTENDS TLAPS
CONSTANT c
VARIABLE x
THEOREM TRUE
<1>1. CASE c = 0
  <2>1. [](c = 0)
    BY <1>1, PTL
  <2> QED
    BY PTL
<1> QED
  OMITTED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 17:5:17:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:5:17:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 17:8:17:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 17:8:17:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 15:5:15:7
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 15:5:15:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 15:8:15:12
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 15:8:15:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 15:14:15:17
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 15:14:15:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    Omitted proof at File "./case_constant_always.tla", line 19, characters 3-9
    File "./case_constant_always.tla", line 8, character 1 to line 20, character 4:
    [ERROR]: Proof incomplete in module "case_constant_always": 0 missing, 1 omitted proof step(s).
    File "./case_constant_always.tla", line 8, character 1 to line 20, character 4:
    [INFO]: All 5 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory case_constant_always imports Constant Zenon begin
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
    not (((always (cc | ~ cc)) -> (cc | ~ cc)))

    --- ls4
    not (((always h7de6a) & (always (cc | ~ cc)) -> (always h7de6a)))
---*)
