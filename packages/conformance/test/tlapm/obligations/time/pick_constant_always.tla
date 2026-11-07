(*---
description: "The predicate of PICK c : c = k for a constant k is constant, so it has the time Always."
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: incomplete
---*)
---- MODULE pick_constant_always ----
EXTENDS TLAPS
CONSTANT k
VARIABLE x
THEOREM TRUE
<1> PICK c : c = k
  OMITTED
<1>1. [](c = k)
  BY PTL
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:3:18:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:3:18:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 18:6:18:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:6:18:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 16:3:16:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 16:3:16:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 16:6:16:9
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 16:6:16:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    Omitted proof at File "./pick_constant_always.tla", line 14, characters 3-9
    File "./pick_constant_always.tla", line 8, character 1 to line 19, character 4:
    [ERROR]: Proof incomplete in module "pick_constant_always": 0 missing, 1 omitted proof step(s).
    File "./pick_constant_always.tla", line 8, character 1 to line 19, character 4:
    [INFO]: All 4 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory pick_constant_always imports Constant Zenon begin
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
    not (((always h57710) & (always (cc | ~ cc)) -> (always h57710)))

    --- ls4
    not (((always h57710) & (always (cc | ~ cc)) -> (cc | ~ cc)))
---*)
