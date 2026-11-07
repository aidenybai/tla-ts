(*---
description: A module-level USE of an axiom adds the fact with the module's time Always, so PTL receives it boxed even in a theorem whose scope is Now.
ref: src/module/m_gen.ml#generate
args: ["--method", "ls4"]
mode: encoding
outcome: proved
---*)
---- MODULE axiom_always ----
EXTENDS TLAPS
VARIABLE x, y
AXIOM A == x = 0
USE A
THEOREM ASSUME y = 1 PROVE [](x = 0)
  BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:1:12:4
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:1:12:4
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 2
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 14:3:14:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 14:6:14:9
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 14:6:14:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./axiom_always.tla", line 8, character 1 to line 15, character 4:
    [INFO]: All 3 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory axiom_always imports Constant Zenon begin
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
    not (((always h4ca64) & hbdff3 -> (always h4ca64)))
---*)
