(*---
description: "The predicate of PICK c : c = x for a variable x has the time Now, so PTL cannot box it, as fixed in 78a4fe6."
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE pick_state_now ----
EXTENDS TLAPS
VARIABLE x
THEOREM TRUE
<1> PICK c : c = x
  OMITTED
<1>1. [](c = x)
  BY PTL
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:3:17:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:3:17:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 17:6:17:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:6:17:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 15:3:15:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 15:3:15:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW CONSTANT c,
           c = x (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](c = x)

    @type: obligation
    @id: 6
    @loc: 15:6:15:9
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 15:6:15:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    Omitted proof at File "./pick_state_now.tla", line 13, characters 3-9
    File "./pick_state_now.tla", line 8, character 1 to line 18, character 4:
    [ERROR]: Proof incomplete in module "pick_state_now": 0 missing, 1 omitted proof step(s).
    File "./pick_state_now.tla", line 15, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW CONSTANT c,
                      c = x ,
                      PTL 
               PROVE  [](c = x)
    File "./pick_state_now.tla", line 8, character 1 to line 18, character 4:
    [ERROR]: 1/4 obligations failed.
    There were backend errors processing module `"pick_state_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory pick_state_now imports Constant Zenon begin
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
    not ((h126c5 -> (always h126c5)))

    --- ls4
    not ((h126c5 -> (cc | ~ cc)))
---*)
