const childProcess = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const getArgsList=(startIndex = 3)=>process.argv.reduce((acc, current, index) => index >= startIndex? acc += current + " " : '', '')

const commands = {
    install: (dirPath)=>`npm install --prefix ${dirPath} ${getArgsList()}`, // npm run npm:install
    build: (dirPath)=>`npm run build --prefix ${dirPath} ${getArgsList()}`, // npm run npm:build
    pack: ()=>`npm pack --pack-destination ${getArgsList()}`, // npm run npm:pack 
}
const npmPath = path.join(__dirname, "..", 'npm');

if(!process.argv[2]) throw new Error(`Укажите команду первым аргументом! Доступные команды: ${Object.keys(commands)}`);
const command = commands[process.argv[2]];
if(!command) throw new Error(`Команда ${process.argv[2]} не найдена! Доступные команды: ${Object.keys(commands)}`);

fs.readdirSync(npmPath).forEach(dir=>{
    const dirPath = path.join(npmPath, dir);
    if(fs.lstatSync(dirPath).isDirectory()){
        execute(command(dirPath), dirPath)
    }
})

function execute(command, dirPath) {
	const subprocess = childProcess.execSync(`cd ${dirPath} && ` + command, {
		encoding: 'utf8',
		shell: true,
		stdio:'inherit'
	} );

	return subprocess;
}