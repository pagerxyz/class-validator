import { IsNotEmpty, ValidateIf, IsOptional, Equals, IsString, ValidateNested } from '../../src/decorator/decorators';
import { Validator } from '../../src/validation/Validator';

const validator = new Validator();

describe('conditional validation', () => {
  describe('condition configuration option', () => {
    it('should validate a valid property when the condition evals true', () => {
      expect.assertions(1);
      class MyClass {
        @IsString({
          condition: v => typeof v === 'string',
        })
        title: string;
      }

      const model = new MyClass();
      model.title = 'Check me out';
      return validator.validate(model).then(errors => {
        expect(errors.length).toEqual(0);
      });
    });
    it('should skip validation when a property when the condition evals false', () => {
      expect.assertions(1);
      class MyClass {
        @IsString({
          condition: v => typeof v === 'string',
        })
        title: string;
      }

      const model = new MyClass();
      model.title = 80 as unknown as string;
      return validator.validate(model).then(errors => {
        expect(errors.length).toEqual(0);
      });
    });
    it('should fail validation when an invalid property is passed & the condition evals true', () => {
      expect.assertions(1);
      class MyClass {
        @IsString({
          condition: v => typeof v === 'number',
        })
        title: string;
      }

      const model = new MyClass();
      model.title = 80 as unknown as string;
      return validator.validate(model).then(errors => {
        expect(errors.length).toEqual(1);
      });
    });
    it('should differentiate validation for a nested class', () => {
      expect.assertions(1);

      class NestedClass {
        @IsString()
        name: string;
      }
      class MyClass {
        @ValidateNested({
          condition: v => typeof v !== 'string',
        })
        @IsString({
          condition: v => typeof v === 'string',
        })
        author: string | NestedClass;
      }

      const model = new MyClass();
      const nestedAuthor = new NestedClass();
      nestedAuthor.name = 'Oda';
      model.author = nestedAuthor;

      return validator.validate(model).then(errors => {
        expect(errors.length).toEqual(0);
      });
    });
  });
  it('should differentiate validation for a string', () => {
    expect.assertions(1);

    class NestedClass {
      @IsString()
      name: string;
    }
    class MyClass {
      @ValidateNested({
        condition: v => typeof v !== 'string',
      })
      @IsString({
        condition: v => typeof v === 'string',
      })
      author: string | NestedClass;
    }

    const model = new MyClass();
    model.author = 'Oda';

    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(0);
    });
  });

  it('should differentiate validation for a string, failing on invalid non-nested property', () => {
    expect.assertions(1);

    class NestedClass {
      @IsString()
      name: string;
    }
    class MyClass {
      @ValidateNested({
        condition: v => typeof v !== 'string',
      })
      @IsString({
        condition: v => typeof v === 'string',
      })
      author: string | NestedClass;
    }

    const model = new MyClass();
    model.author = 800 as unknown as string;

    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(1);
    });
  });

  it("shouldn't validate a property when the condition is false", () => {
    expect.assertions(1);

    class MyClass {
      @ValidateIf(o => false)
      @IsNotEmpty()
      title: string;
    }

    const model = new MyClass();
    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(0);
    });
  });

  it('should validate a property when the condition is true', () => {
    expect.assertions(5);

    class MyClass {
      @ValidateIf(o => true)
      @IsNotEmpty()
      title: string = '';
    }

    const model = new MyClass();
    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('title');
      expect(errors[0].constraints).toEqual({ isNotEmpty: 'title should not be empty' });
      expect(errors[0].value).toEqual('');
    });
  });

  it('should pass the object being validated to the condition function', () => {
    expect.assertions(3);

    class MyClass {
      @ValidateIf(o => {
        expect(o).toBeInstanceOf(MyClass);
        expect(o.title).toEqual('title');
        return true;
      })
      @IsNotEmpty()
      title: string = 'title';
    }

    const model = new MyClass();
    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(0);
    });
  });

  it('should validate a property when value is empty', () => {
    expect.assertions(5);

    class MyClass {
      @IsOptional()
      @Equals('test')
      title: string = '';
    }

    const model = new MyClass();
    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('title');
      expect(errors[0].constraints).toEqual({ equals: 'title must be equal to test' });
      expect(errors[0].value).toEqual('');
    });
  });

  it('should validate a property when value is supplied', () => {
    class MyClass {
      @IsOptional()
      @Equals('test')
      title: string = 'bad_value';
    }

    const model = new MyClass();
    return validator.validate(model).then(errors => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('title');
      expect(errors[0].constraints).toEqual({ equals: 'title must be equal to test' });
      expect(errors[0].value).toEqual('bad_value');
    });
  });
});
