(*---
description: "The bound of NEW c \\in {x} for a variable x becomes a fact with the time Now, so PTL cannot box it, as fixed in efe4f2d."
ref: src/frontend/pltl.ml
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE new_bound_state_now ----
EXTENDS TLAPS
VARIABLE x
THEOREM ASSUME NEW c \in {x} PROVE [](c \in {x})
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW CONSTANT c \in {x},
           TRUE 
    PROVE  [](c \in {x})

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./new_bound_state_now.tla", line 12, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW CONSTANT c \in 
                      {x},
                      PTL 
               PROVE  [](c \in {x})
    File "./new_bound_state_now.tla", line 8, character 1 to line 13, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"new_bound_state_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory new_bound_state_now imports Constant Zenon begin
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
    not ((h0516d & (always (cc | ~ cc)) -> (always h0516d)))
---*)
