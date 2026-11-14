(*---
description: The assumption of CASE x = 0 for a variable x has the time Now, so PTL cannot box it, as fixed in 29b6f94.
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE case_state_now ----
EXTENDS TLAPS
VARIABLE x
THEOREM TRUE
<1>1. CASE x = 0
  <2>1. [](x = 0)
    BY <1>1, PTL
  <2> QED
    BY PTL
<1> QED
  OMITTED
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 16:5:16:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:5:16:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 16:8:16:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 16:8:16:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 14:5:14:7
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 14:5:14:7
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

    @type: obligation
    @id: 5
    @loc: 14:8:14:12
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 14:8:14:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 14:14:14:17
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 14:14:14:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    Omitted proof at File "./case_state_now.tla", line 18, characters 3-9
    File "./case_state_now.tla", line 8, character 1 to line 19, character 4:
    [ERROR]: Proof incomplete in module "case_state_now": 0 missing, 1 omitted proof step(s).
    File "./case_state_now.tla", line 14, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      <1>1 ,
                      PTL 
               PROVE  [](x = 0)
    File "./case_state_now.tla", line 8, character 1 to line 19, character 4:
    [ERROR]: 1/5 obligations failed.
    There were backend errors processing module `"case_state_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory case_state_now imports Constant Zenon begin
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
    not ((cc | ~ cc))

    --- ls4
    not ((h4ca64 -> (always h4ca64)))
---*)
