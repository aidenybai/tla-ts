(*---
description: The fact of HAVE x = 0 for a variable x has the time Now, so PTL cannot box it, as fixed in dc71b28.
ref: src/proof/p_simplify.ml#simplify_step
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE have_state_now ----
EXTENDS TLAPS
VARIABLE x
THEOREM x = 0 => [](x = 0)
<1> HAVE x = 0
<1> QED
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 14:3:14:5
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
    @id: 2
    @loc: 14:6:14:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 14:6:14:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 12:1:12:15
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:1:12:15
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 12:1:12:15
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 12:1:12:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./have_state_now.tla", line 14, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      x = 0 ,
                      PTL 
               PROVE  [](x = 0)
    File "./have_state_now.tla", line 8, character 1 to line 15, character 4:
    [ERROR]: 1/4 obligations failed.
    There were backend errors processing module `"have_state_now"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory have_state_now imports Constant Zenon begin
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
    not (((always (h4ca64 -> (always h4ca64))) -> (h4ca64 -> (always h4ca64))))

    --- ls4
    not ((h4ca64 -> (always h4ca64)))
---*)
