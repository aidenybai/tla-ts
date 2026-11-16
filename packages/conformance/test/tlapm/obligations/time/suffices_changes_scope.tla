(*---
description: A SUFFICES with a Now assumption makes the scope of the later steps Now, so their facts are not boxed.
ref: src/proof/p_gen.ml#prove_assertion
args: ["--method", "ls4"]
mode: encoding
outcome: failed
---*)
---- MODULE suffices_changes_scope ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME [](x = 0) PROVE [](x = 0)
<1> SUFFICES ASSUME y = 1 PROVE [](x = 0)
  BY PTL
<1>1. x = 0
  BY PTL
<1> QED
  BY ONLY <1>1, PTL
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
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

    @type: obligation
    @id: 2
    @loc: 17:11:17:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:11:17:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 17:17:17:20
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 17:17:17:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 13:3:13:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 13:6:13:9
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 13:6:13:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 15:3:15:5
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 15:3:15:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 15:6:15:9
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 15:6:15:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 7

    File "./suffices_changes_scope.tla", line 17, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      <1>1 ,
                      PTL 
               PROVE  [](x = 0)
    File "./suffices_changes_scope.tla", line 8, character 1 to line 18, character 4:
    [ERROR]: 1/7 obligations failed.
    There were backend errors processing module `"suffices_changes_scope"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory suffices_changes_scope imports Constant Zenon begin
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
    not (((always (always h4ca64)) & (always (hbdff3 -> (always h4ca64))) & (always (cc | ~ cc)) -> (always h4ca64)))

    --- ls4
    not (((always (always h4ca64)) & hbdff3 -> h4ca64))

    --- ls4
    not ((h4ca64 -> (always h4ca64)))
---*)
