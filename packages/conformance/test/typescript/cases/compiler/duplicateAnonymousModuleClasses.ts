/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateAnonymousModuleClasses.ts.
outcome: success
source: tests/cases/compiler/duplicateAnonymousModuleClasses.ts
---*/
// @target: es2015
namespace F {

    class Helper {

    }

}


namespace F {
    
    // Should not be an error
    class Helper {

    }

}

namespace Foo {

    class Helper {

    }

}


namespace Foo {
    
    // Should not be an error
    class Helper {

    }

}

namespace Gar {
    namespace Foo {

        class Helper {

        }

    }


    namespace Foo {
    
        // Should not be an error
        class Helper {

        }

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
